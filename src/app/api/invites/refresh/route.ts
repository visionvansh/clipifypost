import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId: authUserId } = await getAuth(request);
    if (!authUserId) {
      console.error('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const invites = await prisma.invite.findMany({
      where: { inviterId: authUserId, status: 'pending' },
      select: { id: true, invitedId: true, invitedUsername: true, status: true },
    });

    const students = await prisma.student.findMany({
      where: { id: { in: invites.map((i) => i.invitedId) } },
      select: {
        id: true,
        username: true,
        discordUsername: true,
        discordId: true,
        signedUpToWebsite: true,
      },
    });
    console.log('Student data for refresh:', JSON.stringify(students, null, 2));

    const pendingUsers = [];
    for (const invite of invites) {
      const student = students.find((s) => s.id === invite.invitedId);
      if (!student) {
        console.warn(`No Student found for Invite.invitedId: ${invite.invitedId}`);
        continue;
      }
      console.log(`Processing Invite ${invite.id}, Student.id: ${student.id}, discordUsername: ${student.discordUsername}`);

      // Fetch totalViews directly from UserStatsRecord via Student
      const totalViews = await prisma.userStatsRecord.aggregate({
        where: { clerkUserId: student.id },
        _sum: { totalViews: true },
      });
      const views = totalViews._sum.totalViews ?? 0;
      console.log(`Fetched totalViews for Invite ${invite.id}, Student.id: ${student.id}, clerkUserId: ${student.id}, totalViews: ${views}`);

      // Set status based on totalViews
      const newStatus = views >= 10000 ? 'approved' : 'pending';
      if (invite.status !== newStatus) {
        await prisma.$transaction(async (tx) => {
          await tx.invite.update({
            where: { id: invite.id },
            data: {
              invitedUsername: student?.username || invite.invitedUsername,
              status: newStatus,
            },
          });
          console.log('Updated Invite status:', {
            inviteId: invite.id,
            username: student?.username || invite.invitedUsername,
            totalViews: views,
            status: newStatus,
            previousStatus: invite.status,
          });
        });
      } else {
        console.log(`No status update needed for Invite ${invite.id}, already ${newStatus}`);
      }

      pendingUsers.push({
        username: student?.username || 'Unknown',
        discordUsername: student?.discordUsername || invite.invitedUsername || 'N/A',
        discordId: student?.discordId || 'N/A',
        totalViews: views,
        isApproved: views >= 10000,
        signedUpToWebsite: student?.signedUpToWebsite || false,
      });
    }

    const approvedUsers = await prisma.invite.count({
      where: { inviterId: authUserId, status: 'approved' },
    });

    // Calculate earnings: $0.5 per approved user
    const earnings = approvedUsers * 0.5;
    console.log(`Calculated earnings: ${approvedUsers} approved users * $0.5 = $${earnings}`);

    const expectedCount = await prisma.invite.count({
      where: { inviterId: authUserId },
    });

    const loggedInWebsite = await prisma.student.count({
      where: {
        id: { in: invites.map((i) => i.invitedId) },
        signedUpToWebsite: true,
      },
    });

    await prisma.inviteStats.upsert({
      where: { studentId: authUserId },
      update: { inviteCount: expectedCount, updatedAt: new Date() },
      create: {
        studentId: authUserId,
        inviteCount: expectedCount,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Refresh completed',
      pendingUsers,
      approvedUsers,
      earnings, // Add earnings to response
      inviteCount: expectedCount,
      loggedInWebsite,
    });
  } catch (error: unknown) {
    console.error('Error refreshing invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}