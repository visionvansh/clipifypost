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
      'NEXT_PUBLIC_BASE_URL',
      'RENDER_API_URL',
      'API_KEY',
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

    console.log('Received OAuth code:', code);

    const { userId: authUserId } = await getAuth(request);
    if (!authUserId) {
      console.error('No Clerk user ID');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=clerk_auth_failed`);
    }
    console.log('Authenticated user ID:', authUserId);

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

      tokenResponse = await axios.post(
        'https://discord.com/api/oauth2/token',
        tokenRequestBody,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      console.log('Token exchange successful:', tokenResponse.data);
    } catch (error: any) {
      console.error('Token exchange failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=token_exchange_failed&details=${encodeURIComponent(error.response?.data?.error || 'Unknown error')}`);
    }

    const { access_token } = tokenResponse.data;

    let userResponse;
    try {
      userResponse = await axios.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      console.log('Fetched Discord user data:', userResponse.data);
    } catch (error: any) {
      console.error('User data fetch failed:', error.message);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=user_fetch_failed`);
    }

    const { id: discordId, username: discordUsername, email: discordEmail } = userResponse.data;

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
            email:  student.email || discordEmail || `${discordId}@example.com`,
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
    let threadId = null;
    try {
      const renderResponse = await axios.post(
        `${process.env.RENDER_API_URL}/generate-invite`,
        { discordId, discordUsername },
        {
          headers: {
            'Authorization': `Bearer ${process.env.API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      ({ inviteUrl, threadId } = renderResponse.data);
      console.log('Received invite from Render:', { inviteUrl, threadId });
    } catch (error: any) {
      console.error('Failed to generate invite from Render:', error.message);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/?error=invite_creation_failed`);
    }

    try {
      let existingInviteLink = await prisma.inviteLink.findFirst({
        where: { studentId: authUserId },
      });

      if (!existingInviteLink && inviterInviteLink) {
        await prisma.inviteLink.create({
          data: {
            studentId: authUserId,
            discordId,
            inviteLink: inviterInviteLink.inviteLink,
            inviteCode: inviterInviteLink.inviteCode,
            threadId,
          },
        });
        console.log('Copied inviter InviteLink to new student:', { studentId: authUserId, inviteLink: inviteUrl, threadId });
      } else if (!existingInviteLink) {
        await prisma.inviteLink.create({
          data: {
            studentId: authUserId,
            discordId,
            inviteLink: inviteUrl,
            inviteCode: inviteUrl.split('/').pop(),
            threadId,
          },
        });
        console.log('Created invite link:', { studentId: authUserId, inviteLink: inviteUrl, threadId });
      } else {
        await prisma.inviteLink.update({
          where: { id: existingInviteLink.id },
          data: {
            discordId,
            inviteLink: inviteUrl,
            inviteCode: inviteUrl.split('/').pop(),
            threadId: threadId || existingInviteLink.threadId,
            updatedAt: new Date(),
          },
        });
        console.log('Updated existing invite link:', { studentId: authUserId, inviteLink: inviteUrl, threadId });
      }
    } catch (error: unknown) {
      console.error('Invite link creation failed:', error instanceof Error ? error.stack : String(error));
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