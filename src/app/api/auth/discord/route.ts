import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import prisma from '@/lib/prisma';
import { Client, GatewayIntentBits, TextChannel, ChannelType } from 'discord.js'; // Added ChannelType
import { getAuth } from '@clerk/nextjs/server';

let DiscordClient: Client | null = null;
const inviteCache = new Map<string, number>();
const processedMembers = new Set<string>();

async function initializeDiscordClient() {
  try {
    DiscordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        
      ],
    });

    await DiscordClient.login(process.env.DISCORD_BOT_TOKEN);
    console.log('Discord client initialized successfully');

    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) {
      console.error('Missing DISCORD_GUILD_ID');
      throw new Error('DISCORD_GUILD_ID not set');
    }
    const guild = await DiscordClient.guilds.fetch(guildId);
    const invites = await guild.invites.fetch();
    invites.forEach((invite) => {
      inviteCache.set(invite.code, invite.uses || 0);
    });
    console.log('Cached invites:', Array.from(inviteCache.entries()));

    DiscordClient.on('guildMemberAdd', async (member) => {
      try {
        console.log(`guildMemberAdd: ${member.id}, Username: ${member.user.username}, Tag: ${member.user.tag}`);

        if (processedMembers.has(member.id)) {
          console.log(`Member ${member.id} already processed, allowing rejoin`);
          processedMembers.delete(member.id);
        }
        processedMembers.add(member.id);

        const guild = member.guild;
        const channelId = process.env.DISCORD_TEXT_CHANNEL_ID;
        if (!channelId) {
          console.error('Missing DISCORD_TEXT_CHANNEL_ID');
          throw new Error('DISCORD_TEXT_CHANNEL_ID not set');
        }

        const channel = await guild.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) {
          console.error('Invalid text channel:', channelId);
          throw new Error(`Channel ${channelId} is not a valid text channel`);
        }

        const newInvites = await guild.invites.fetch();
        let usedInvite = null;
        for (const invite of newInvites.values()) {
          const cachedUses = inviteCache.get(invite.code) || 0;
          if ((invite.uses || 0) > cachedUses) {
            usedInvite = invite;
            inviteCache.set(invite.code, invite.uses || 0);
            break;
          }
        }

        if (!usedInvite) {
          console.warn('No used invite detected for member:', member.id);
          const inviteLinks = await prisma.inviteLink.findMany();
          for (const inviteLink of inviteLinks) {
            const invite = newInvites.find((i) => i.code === inviteLink.inviteCode);
            if (invite) {
              usedInvite = invite;
              inviteCache.set(invite.code, invite.uses || 0);
              console.log(`Fallback: Matched invite code ${invite.code} from InviteLink`);
              break;
            }
          }
        }

        let welcomeMessage = `Welcome ${member.user.tag} to ${guild.name}!`;
        let inviterUsername = 'Unknown';
        let inviteLink = null;

        if (usedInvite) {
          console.log(`Used invite: ${usedInvite.code}, Uses: ${usedInvite.uses}`);
          inviteLink = await prisma.inviteLink.findFirst({
            where: { inviteCode: usedInvite.code },
            include: { student: true },
          });

          if (inviteLink?.student) {
            inviterUsername = inviteLink.student.discordUsername || 'Unknown';
            // Find inviter's private thread
            if (inviteLink.threadId && DiscordClient) {
              const thread = await guild.channels.fetch(inviteLink.threadId);
              if (thread && thread.isThread()) {
                await thread.send(`New user ${member.user.tag} joined using your invite link!`);
                console.log(`Sent notification to private thread ${inviteLink.threadId} for ${inviterUsername}`);
              } else {
                console.warn(`Thread ${inviteLink.threadId} not found or invalid for ${inviterUsername}`);
                // Fallback to DM if thread is missing
                const inviterUser = await DiscordClient.users.fetch(inviteLink.discordId || inviteLink.studentId);
                await inviterUser.send(`New user ${member.user.tag} joined using your invite link!`);
              }
            } else {
              console.warn(`No threadId found for invite code ${usedInvite.code}, sending to DM`);
              if (DiscordClient) {
                const inviterUser = await DiscordClient.users.fetch(inviteLink.discordId || inviteLink.studentId);
                await inviterUser.send(`New user ${member.user.tag} joined using your invite link!`);
              }
            }
            welcomeMessage += ` Invited by ${inviterUsername} using invite code ${usedInvite.code}.`;
          } else {
            console.warn('No inviter found for invite code:', usedInvite.code);
            welcomeMessage += ` Joined via invite code ${usedInvite.code}.`;
          }
        } else {
          console.error('No invite matched for member:', member.id);
          welcomeMessage += ' No invite details available.';
        }

        // Send welcome message to main channel (unchanged)
        await channel.send(welcomeMessage);
        console.log(`Sent welcome message for ${member.user.tag}`);

        const existingStudent = await prisma.student.findFirst({
          where: { discordId: member.id },
        });

        if (existingStudent) {
          if (!existingStudent.signedUpToWebsite) {
            await prisma.student.update({
              where: { id: existingStudent.id },
              data: {
                discordId: member.id,
                discordUsername: member.user.username,
                discordEmail: null,
                email: existingStudent.email || `discord_${member.id}@example.com`,
                signedUpToWebsite: false,
              },
            });
            console.log('Updated existing student from server join:', existingStudent.id);
          } else {
            console.log('Skipping update, student already signed up:', existingStudent.id);
          }
        } else {
          await prisma.student.create({
            data: {
              id: `discord_${member.id}`,
              discordId: member.id,
              discordUsername: member.user.username,
              discordEmail: null,
              username: `discord_${member.id}`,
              email: `discord_${member.id}@example.com`,
              signedUpToWebsite: false,
            },
          });
          console.log('Created student from server join:', `discord_${member.id}`);
        }

        if (inviteLink?.student) {
          const invitedStudent = await prisma.student.findFirst({
            where: { discordId: member.id },
          });

          if (!invitedStudent) {
            console.error('No invited student found for discordId:', member.id);
            return;
          }

          const existingInvite = await prisma.invite.findFirst({
            where: {
              inviterId: inviteLink.studentId,
              invitedId: invitedStudent.id,
            },
          });

          if (!existingInvite) {
            await prisma.$transaction(async (tx) => {
              const totalViews = await tx.userStatsRecord.aggregate({
                where: { clerkUserId: invitedStudent.id },
                _sum: { totalViews: true },
              });
              const views = totalViews._sum.totalViews ?? 0;
              console.log(`Creating Invite for ${invitedStudent.id}, clerkUserId: ${invitedStudent.id}, totalViews: ${views}`);

              const newStatus = views >= 10000 ? 'approved' : 'pending';
              const newInvite = await tx.invite.create({
                data: {
                  inviterId: inviteLink.studentId,
                  invitedId: invitedStudent.id,
                  invitedUsername: invitedStudent.discordUsername || null,
                  status: newStatus,
                },
              });
              console.log('Created Invite:', {
                inviteId: newInvite.id,
                username: invitedStudent.discordUsername,
                totalViews: views,
                status: newStatus,
              });

              const expectedCount = await tx.invite.count({
                where: { inviterId: inviteLink.studentId },
              });
              await tx.inviteStats.upsert({
                where: { studentId: inviteLink.studentId },
                update: { inviteCount: expectedCount, updatedAt: new Date() },
                create: {
                  studentId: inviteLink.studentId,
                  inviteCount: expectedCount,
                  updatedAt: new Date(),
                },
              });
              console.log('Updated InviteStats:', { studentId: inviteLink.studentId, count: expectedCount });

              await tx.inviteTracking.create({
                data: {
                  inviterId: inviteLink.discordId || inviteLink.studentId,
                  invitedId: member.id,
                  invitedUsername: member.user.username,
                },
              });
              console.log('Created InviteTracking:', { inviterId: inviteLink.studentId, invitedId: member.id });
            });
          } else {
            const totalViews = await prisma.userStatsRecord.aggregate({
              where: { clerkUserId: invitedStudent.id },
              _sum: { totalViews: true },
            });
            const views = totalViews._sum.totalViews ?? 0;
            console.log(`Updating Invite for ${invitedStudent.id}, clerkUserId: ${invitedStudent.id}, totalViews: ${views}`);

            await prisma.$transaction(async (tx) => {
              const newStatus = views >= 10000 ? 'approved' : 'pending';
              await tx.invite.update({
                where: { id: existingInvite.id },
                data: {
                  invitedUsername: invitedStudent.discordUsername || null,
                  status: newStatus,
                },
              });
              console.log('Updated Invite:', {
                inviteId: existingInvite.id,
                username: invitedStudent.discordUsername,
                totalViews: views,
                status: newStatus,
                previousStatus: existingInvite.status,
              });
            });
          }
        } else {
          console.warn('Skipping Invite creation: No valid inviteLink found');
        }
      } catch (error: unknown) {
        console.error('Error in guildMemberAdd:', error instanceof Error ? error.stack : String(error));
      }
    });
  } catch (error: unknown) {
    console.error('Failed to initialize Discord client:', error instanceof Error ? error.stack : String(error));
    DiscordClient = null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      const redirectUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI!)}&response_type=code&scope=identify%20email%20guilds.join`;
      console.log('Redirecting to Discord OAuth:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('Received OAuth code:', code);

    const { userId: authUserId } = await getAuth(request);
    if (!authUserId) {
      console.error('No Clerk user ID');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=clerk_auth_failed`);
    }
    console.log('Authenticated user ID:', authUserId);

    let tokenResponse;
    try {
      tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID!,
          client_secret: process.env.DISCORD_CLIENT_SECRET!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.DISCORD_REDIRECT_URI!,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      console.log('Token exchange successful');
    } catch (error: unknown) {
      console.error('Token exchange failed:', error instanceof Error ? error.stack : String(error));
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=token_exchange_failed`);
    }

    const { access_token } = tokenResponse.data;

    let userResponse;
    try {
      userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      console.log('Fetched Discord user data:', userResponse.data);
    } catch (error: unknown) {
      console.error('User data fetch failed:', error instanceof Error ? error.stack : String(error));
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=user_fetch_failed`);
    }

    const { id: discordId, username: discordUsername, email: discordEmail } = userResponse.data;

    if (!DiscordClient) {
      await initializeDiscordClient();
      console.log('Discord client status:', DiscordClient ? 'Initialized' : 'Failed');
    }

    let student = await prisma.student.findUnique({
      where: { id: authUserId },
    });

    const staleStudents = await prisma.student.findMany({
      where: {
        OR: [
          { discordId: discordId },
          { discordUsername: discordUsername },
        ],
        id: { not: authUserId },
        signedUpToWebsite: false,
      },
    });

    let inviterInviteLink = null;
    let preservedInvites: { inviterId: string; invitedUsername: string | null; status: string }[] = [];
    if (staleStudents.length > 0) {
      for (const staleStudent of staleStudents) {
        const invites = await prisma.invite.findMany({
          where: { invitedId: staleStudent.id },
          include: { inviter: { include: { inviteLinks: true } } },
        });

        for (const invite of invites) {
          if (invite.inviter.inviteLinks.length > 0) {
            inviterInviteLink = invite.inviter.inviteLinks[0];
            console.log('Preserving InviteLink for stale student:', JSON.stringify(inviterInviteLink));
          }
          preservedInvites.push({
            inviterId: invite.inviterId,
            invitedUsername: invite.invitedUsername || null,
            status: invite.status,
          });
          console.log('Preserved Invite:', JSON.stringify(invite));
        }
      }

      await prisma.$transaction(async (tx) => {
        for (const staleStudent of staleStudents) {
          await tx.invite.deleteMany({
            where: { invitedId: staleStudent.id },
          });
          console.log('Deleted related Invites for stale student:', staleStudent.id);

          await tx.student.delete({
            where: { id: staleStudent.id },
          });
          console.log('Deleted stale student:', staleStudent.id);
        }
      });
    }

    try {
      if (!student) {
        student = await prisma.student.create({
          data: {
            id: authUserId,
            username: `user_${authUserId}`,
            email: discordEmail || `${discordId}@example.com`,
            discordId,
            discordUsername,
            discordEmail: discordEmail || null,
            signedUpToWebsite: true,
          },
        });
        console.log('Created new student:', JSON.stringify(student));
      } else {
        student = await prisma.student.update({
          where: { id: authUserId },
          data: {
            discordId,
            discordUsername,
            discordEmail: discordEmail || null,
            email: discordEmail || student.email || `${discordId}@example.com`,
            signedUpToWebsite: true,
          },
        });
        console.log('Updated student:', JSON.stringify(student));
      }
    } catch (error: unknown) {
      console.error('Prisma student create/update failed:', error instanceof Error ? error.stack : String(error));
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=prisma_student_failed`);
    }

    if (preservedInvites.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const preservedInvite of preservedInvites) {
          const existingInvite = await tx.invite.findFirst({
            where: {
              inviterId: preservedInvite.inviterId,
              invitedId: student.id,
            },
          });

          const totalViews = await tx.userStatsRecord.aggregate({
            where: { clerkUserId: student.id },
            _sum: { totalViews: true },
          });
          const views = totalViews._sum.totalViews ?? 0;
          console.log(`Processing preserved Invite for ${student.id}, clerkUserId: ${student.id}, totalViews: ${views}`);

          const newStatus = views >= 10000 ? 'approved' : 'pending';
          if (!existingInvite) {
            const newInvite = await tx.invite.create({
              data: {
                inviterId: preservedInvite.inviterId,
                invitedId: student.id,
                invitedUsername: preservedInvite.invitedUsername || discordUsername || null,
                status: newStatus,
              },
            });
            console.log('Recreated Invite for new student:', {
              inviteId: newInvite.id,
              username: preservedInvite.invitedUsername || discordUsername,
              totalViews: views,
              status: newStatus,
              previousStatus: preservedInvite.status,
            });

            const existingTracking = await tx.inviteTracking.findFirst({
              where: {
                AND: [
                  { inviterId: preservedInvite.inviterId },
                  { invitedId: discordId },
                ],
              },
            });

            if (existingTracking) {
              await tx.inviteTracking.update({
                where: { id: existingTracking.id },
                data: {
                  invitedUsername: discordUsername,
                },
              });
              console.log('Updated InviteTracking:', { inviterId: preservedInvite.inviterId, invitedId: discordId });
            } else {
              await tx.inviteTracking.create({
                data: {
                  inviterId: preservedInvite.inviterId,
                  invitedId: discordId,
                  invitedUsername: discordUsername,
                },
              });
              console.log('Created InviteTracking:', { inviterId: preservedInvite.inviterId, invitedId: discordId });
            }
          } else {
            await tx.invite.update({
              where: { id: existingInvite.id },
              data: {
                invitedUsername: preservedInvite.invitedUsername || discordUsername || null,
                status: newStatus,
              },
            });
            console.log('Updated existing Invite:', {
              inviteId: existingInvite.id,
              username: preservedInvite.invitedUsername || discordUsername,
              totalViews: views,
              status: newStatus,
              previousStatus: existingInvite.status,
            });
          }

          const expectedCount = await tx.invite.count({
            where: { inviterId: preservedInvite.inviterId },
          });
          await tx.inviteStats.upsert({
            where: { studentId: preservedInvite.inviterId },
            update: { inviteCount: expectedCount, updatedAt: new Date() },
            create: {
              studentId: preservedInvite.inviterId,
              inviteCount: expectedCount,
              updatedAt: new Date(),
            },
          });
          console.log('Updated InviteStats:', { studentId: preservedInvite.inviterId, count: expectedCount });
        }
      });
    }

    let inviteUrl = null;
    if (DiscordClient) {
      const guildId = process.env.DISCORD_GUILD_ID;
      const channelId = process.env.DISCORD_TEXT_CHANNEL_ID;
      if (!guildId || !channelId) {
        console.error('Missing DISCORD_GUILD_ID or DISCORD_TEXT_CHANNEL_ID');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=discord_config_missing`);
      }

      try {
        const guild = await DiscordClient.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !(channel instanceof TextChannel)) {
          console.error('Invalid text channel:', channelId);
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invalid_text_channel`);
        }

        let existingInviteLink = await prisma.inviteLink.findFirst({
          where: { studentId: authUserId },
        });

        let thread = null;
        if (!existingInviteLink || !existingInviteLink.threadId) {
          // Create private thread for the user
          thread = await channel.threads.create({
            name: `referral-${discordUsername}-${discordId}`,
            type: ChannelType.GuildPrivateThread, // Fixed type
            invitable: false,
          });
          await thread.members.add(discordId);
          console.log(`Created private thread ${thread.id} for ${discordUsername}`);
        } else if (existingInviteLink.threadId) {
          // Fetch existing thread
          thread = await guild.channels.fetch(existingInviteLink.threadId);
          if (!thread || !thread.isThread()) {
            console.warn(`Thread ${existingInviteLink.threadId} not found, creating new one`);
            thread = await channel.threads.create({
              name: `referral-${discordUsername}-${discordId}`,
              type: ChannelType.GuildPrivateThread, // Fixed type
              invitable: false,
            });
            await thread.members.add(discordId);
            console.log(`Created new private thread ${thread.id} for ${discordUsername}`);
          }
        }

        if (!existingInviteLink && inviterInviteLink) {
          await prisma.inviteLink.create({
            data: {
              studentId: authUserId,
              discordId,
              inviteLink: inviterInviteLink.inviteLink,
              inviteCode: inviterInviteLink.inviteCode,
              threadId: thread?.id,
            },
          });
          inviteUrl = inviterInviteLink.inviteLink;
          console.log('Copied inviter InviteLink to new student:', { studentId: authUserId, inviteLink: inviteUrl, threadId: thread?.id });
        } else if (!existingInviteLink) {
          const invite = await channel.createInvite({
            maxUses: 0,
            maxAge: 0,
            unique: true,
            temporary: false,
          });
          inviteUrl = invite.url;
          const inviteCode = invite.code;
          console.log('Created new invite:', { url: inviteUrl, code: inviteCode });

          await prisma.inviteLink.create({
            data: {
              studentId: authUserId,
              discordId,
              inviteLink: inviteUrl,
              inviteCode,
              threadId: thread?.id,
            },
          });
          console.log('Created invite link:', { studentId: authUserId, inviteLink: inviteUrl, threadId: thread?.id });
        } else {
          inviteUrl = existingInviteLink.inviteLink;
          await prisma.inviteLink.update({
            where: { id: existingInviteLink.id },
            data: {
              discordId,
              threadId: thread?.id || existingInviteLink.threadId,
              updatedAt: new Date(),
            },
          });
          console.log('Updated existing invite link:', { studentId: authUserId, inviteLink: inviteUrl, threadId: thread?.id });
        }

        // Send invite link to private thread instead of main channel
        if (thread) {
          await thread.send(`New invite link for ${student.discordUsername || 'User'}: ${inviteUrl}`);
          console.log(`Sent invite link to private thread ${thread.id}`);
        } else {
          console.warn('No thread available, sending invite link to DM');
          if (DiscordClient) {
            const user = await DiscordClient.users.fetch(discordId);
            await user.send(`Your invite link: ${inviteUrl}`);
          }
        }
      } catch (error: unknown) {
        console.error('Invite creation failed:', error instanceof Error ? error.stack : String(error));
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invite_creation_failed`);
      }
    }

    const invites = await prisma.invite.findMany({
      where: { invitedId: student.id },
      select: { id: true, invitedId: true, invitedUsername: true, status: true },
    });
    for (const invite of invites) {
      const totalViews = await prisma.userStatsRecord.aggregate({
        where: { clerkUserId: student.id },
        _sum: { totalViews: true },
      });
      const views = totalViews._sum.totalViews ?? 0;
      console.log(`Syncing Invite ${invite.id} for ${student.id}, clerkUserId: ${student.id}, totalViews: ${views}`);

      const newStatus = views >= 10000 ? 'approved' : 'pending';
      if (invite.status !== newStatus) {
        await prisma.$transaction(async (tx) => {
          await tx.invite.update({
            where: { id: invite.id },
            data: {
              invitedUsername: student.discordUsername || null,
              status: newStatus,
            },
          });
          console.log('Synced Invite:', {
            inviteId: invite.id,
            username: student.discordUsername,
            totalViews: views,
            status: newStatus,
            previousStatus: invite.status,
          });

          const expectedCount = await tx.invite.count({
            where: { inviterId: invite.invitedId },
          });
          await tx.inviteStats.upsert({
            where: { studentId: invite.invitedId },
            update: { inviteCount: expectedCount, updatedAt: new Date() },
            create: {
              studentId: invite.invitedId,
              inviteCount: expectedCount,
              updatedAt: new Date(),
            },
          });
          console.log('Updated InviteStats for inviter:', { studentId: invite.invitedId, count: expectedCount });
        });
      } else {
        console.log(`No status update needed for Invite ${invite.id}, already ${newStatus}`);
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/users`);
  } catch (error: unknown) {
    console.error('Error in Discord auth:', error instanceof Error ? error.stack : String(error));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}