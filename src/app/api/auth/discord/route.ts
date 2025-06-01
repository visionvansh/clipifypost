import { NextResponse, NextRequest } from 'next/server';
import axios from 'axios';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Validate environment variables
    const requiredEnvVars = [
      'DISCORD_CLIENT_ID',
      'DISCORD_CLIENT_SECRET',
      'DISCORD_REDIRECT_URI',
      'DISCORD_BOT_API_URL',
      'DISCORD_GUILD_ID',
      'DISCORD_TEXT_CHANNEL_ID',
      'NEXT_PUBLIC_BASE_URL',
    ];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.error(`Missing environment variable: ${envVar}`);
        return NextResponse.json({ error: `Missing ${envVar}` }, { status: 500 });
      }
    }

    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
      const redirectUri = process.env.DISCORD_REDIRECT_URI!;
      const redirectUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
      console.log('Redirecting to Discord OAuth:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    console.log('Received OAuth code:', { code });

    const { userId } = await getAuth(request);
    if (!userId) {
      console.error('No Clerk user ID found');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invalid_session`);
    }
    console.log('Authenticated user ID:', { userId });

    let tokenResponse;
    try {
      const redirectUri = process.env.DISCORD_REDIRECT_URI!;
      const tokenRequestBody = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID!,
        client_secret: process.env.DISCORD_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      });

      console.log('Token exchange request:', {
        url: 'https://discord.com/api/oauth2/token',
        body: tokenRequestBody.toString(),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        tokenRequestBody,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      console.log('Token exchange successful:', { tokenResponse: tokenResponse.data });
    } catch (error: any) {
      console.error('Token exchange failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.data?.error === 'invalid_grant') {
        const redirectUri = process.env.DISCORD_REDIRECT_URI!;
        const redirectUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20email%20guilds.join`;
        console.log('Invalid grant detected, redirecting to:', redirectUrl);
        return NextResponse.redirect(redirectUrl);
      }

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_BASE_URL}/?error=token_exchange_failed&details=${encodeURIComponent(
          error.response?.data?.error_description || 'Unknown error'
        )}`
      );
    }

    const { access_token } = tokenResponse.data;

    let userResponse;
    try {
      userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      console.log('Fetched Discord user data:', { userData: userResponse.data });
    } catch (error: any) {
      console.error('User data fetch failed:', { error: error.message });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=user_fetch_failed`);
    }

    const { id: discordId, username: discordUsername, email: discordEmail } = userResponse.data;

    // Sync guildMemberAdd logic
    let inviteLink = null;
    const inviteCode = url.searchParams.get('invite_code');
    if (inviteCode) {
      inviteLink = await prisma.inviteLink.findFirst({
        where: { inviteCode },
        include: { student: true },
      });
    }

    let student = await prisma.student.findUnique({
      where: { id: userId },
    });

    const staleStudents = await prisma.student.findMany({
      where: {
        OR: [
          { discordId: discordId },
          { discordUsername: discordUsername },
        ],
        id: { not: userId },
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
        // Create new student, include required fields to satisfy Prisma schema
        student = await prisma.student.create({
          data: {
            id: userId,
            username: `user_${userId}`, // Required field
            email: `user_${userId}@example.com`, // Required field, fallback
            discordId,
            discordUsername,
            discordEmail: discordEmail || null,
            signedUpToWebsite: true, // Set to true on Discord connect
          },
        });
        console.log('Created new student:', JSON.stringify(student));
      } else {
        // Update only Discord fields and signedUpToWebsite
        student = await prisma.student.update({
          where: { id: userId },
          data: {
            discordId,
            discordUsername,
            discordEmail: discordEmail || null,
            signedUpToWebsite: true, // Set to true on Discord connect
          },
        });
        console.log('Updated student:', JSON.stringify(student));
      }

      if (inviteLink?.student) {
        const invitedStudent = await prisma.student.findFirst({
          where: { discordId },
        });

        if (!invitedStudent) {
          console.error('No invited student found for discordId:', discordId);
        } else {
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
                  invitedId: discordId,
                  invitedUsername: discordUsername,
                },
              });
              console.log('Created InviteTracking:', { inviterId: inviteLink.studentId, invitedId: discordId });
            });

            try {
              const threadId = inviteLink.threadId;
              if (threadId) {
                await axios.post(`${process.env.DISCORD_BOT_API_URL}/send-thread-message`, {
                  threadId,
                  content: `New user ${discordUsername} joined using your invite link!`,
                });
                console.log(`Sent notification to thread ${threadId}`);
              } else {
                await axios.post(`${process.env.DISCORD_BOT_API_URL}/send-dm`, {
                  discordId: inviteLink.discordId || inviteLink.studentId,
                  content: `New user ${discordUsername} joined using your invite link!`,
                });
                console.log(`Sent DM to ${inviteLink.discordId || inviteLink.studentId}`);
              }
            } catch (error) {
              console.error('Notification failed:', error);
            }
          }
        }
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
    try {
      const guildId = process.env.DISCORD_GUILD_ID;
      const channelId = process.env.DISCORD_TEXT_CHANNEL_ID;
      if (!guildId || !channelId) {
        console.error('Missing DISCORD_GUILD_ID or DISCORD_TEXT_CHANNEL_ID');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=discord_config_missing`);
      }

      let existingInviteLink = await prisma.inviteLink.findFirst({
        where: { studentId: userId },
      });

      let threadId = null;
      if (!existingInviteLink || !existingInviteLink.threadId) {
        try {
          const threadResponse = await axios.post(`${process.env.DISCORD_BOT_API_URL}/create-thread`, {
            channelId,
            name: `referral-${discordUsername}-${discordId}`,
            discordId,
          });
          threadId = threadResponse.data.threadId;
          console.log(`Created thread ${threadId} for ${discordUsername}`);
        } catch (error: any) {
          console.error('Thread creation failed:', error.message);
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=thread_creation_failed`);
        }
      } else {
        threadId = existingInviteLink.threadId;
        try {
          await axios.post(`${process.env.DISCORD_BOT_API_URL}/send-thread-message`, {
            threadId,
            content: 'Thread verification',
          });
        } catch (error: any) {
          console.warn(`Thread ${threadId} not found, creating new one`);
          try {
            const threadResponse = await axios.post(`${process.env.DISCORD_BOT_API_URL}/create-thread`, {
              channelId,
              name: `referral-${discordUsername}-${discordId}`,
              discordId,
            });
            threadId = threadResponse.data.threadId;
            console.log(`Created new thread ${threadId} for ${discordUsername}`);
          } catch (error: any) {
            console.error('Thread creation failed:', error.message);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=thread_creation_failed`);
          }
        }
      }

      if (!existingInviteLink && inviterInviteLink) {
        await prisma.inviteLink.create({
          data: {
            studentId: userId,
            discordId,
            inviteLink: inviterInviteLink.inviteLink,
            inviteCode: inviterInviteLink.inviteCode,
            threadId,
          },
        });
        inviteUrl = inviterInviteLink.inviteLink;
        console.log('Copied invite link to new student:', { studentId: userId, inviteLink: inviteUrl, threadId });
      } else if (!existingInviteLink) {
        try {
          const inviteResponse = await axios.post(`${process.env.DISCORD_BOT_API_URL}/create-invite`, {
            channelId,
          });
          inviteUrl = inviteResponse.data.inviteUrl;
          const inviteCode = inviteResponse.data.inviteCode;
          console.log('Created new invite:', { url: inviteUrl, code: inviteCode });

          await prisma.inviteLink.create({
            data: {
              studentId: userId,
              discordId,
              inviteLink: inviteUrl,
              inviteCode,
              threadId,
            },
          });
          console.log('Created invite link:', { studentId: userId, inviteLink: inviteUrl, threadId });
        } catch (error: any) {
          console.error('Invite creation failed:', error.message);
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invite_creation_failed`);
        }
      } else {
        inviteUrl = existingInviteLink.inviteLink;
        await prisma.inviteLink.update({
          where: { id: existingInviteLink.id },
          data: {
            discordId,
            threadId: threadId || existingInviteLink.threadId,
            updatedAt: new Date(),
          },
        });
        console.log('Updated existing invite link:', { studentId: userId, inviteLink: inviteUrl, threadId });
      }

      if (threadId) {
        try {
          await axios.post(`${process.env.DISCORD_BOT_API_URL}/send-thread-message`, {
            threadId,
            content: `New invite link for ${student.discordUsername || 'User'}: ${inviteUrl}`,
          });
          console.log(`Sent invite link to thread ${threadId}`);
        } catch (error: any) {
          console.error('Failed to send message to thread:', error.message);
          return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=thread_message_failed`);
        }
      } else {
        console.warn('No thread available, sending invite link to DM');
        try {
          await axios.post(`${process.env.DISCORD_BOT_API_URL}/dm`, {
            discordId,
            content: `Your invite link: ${inviteUrl}`,
          });
          console.log(`Sent invite link to user ${discordId} via DM`);
        } catch (error: any) {
          console.error('Failed to send DM:', error.message);
        }
      }
    } catch (error: unknown) {
      console.error('Invite creation failed:', error instanceof Error ? error.stack : String(error));
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invite_creation_failed`);
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
      console.log(`Syncing invite ${invite.id} for ${student.id}, clerkUserId: ${student.id}, views: ${views}`);

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
          console.log('Updated InviteStats:', { studentId: invite.invitedId, count: expectedCount });
        });
      } else {
        console.log(`No status update needed for invite ${invite.id}, already ${newStatus}`);
      }
    }

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/users`);
  } catch (error: any) {
    console.error('Error in Discord auth:', error instanceof Error ? error.stack : String(error));
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}