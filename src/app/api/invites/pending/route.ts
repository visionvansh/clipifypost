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

    console.log('Authenticated user ID for pending users:', authUserId);

    const invites = await prisma.invite.findMany({
      where: { inviterId: authUserId, status: 'pending' },
      select: { id: true, invitedId: true, invitedUsername: true, status: true },
    });

    console.log('Pending invites:', JSON.stringify(invites, null, 2));

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
    console.log('Student data:', JSON.stringify(students, null, 2));

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

    return NextResponse.json({
      pendingUsers,
      approvedUsers,
      earnings, // Add earnings to response
    });
  } catch (error: unknown) {
    console.error('Error fetching pending users:', error);
    return NextResponse.json(
      { error: 'Failed to load pending users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}