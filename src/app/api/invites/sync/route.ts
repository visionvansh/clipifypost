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
      where: { inviterId: authUserId },
      select: { id: true, invitedId: true },
    });
    const seenInvitedIds = new Set<string>();
    for (const invite of invites) {
      if (seenInvitedIds.has(invite.invitedId)) {
        await prisma.invite.delete({ where: { id: invite.id } });
        console.log('Deleted duplicate invite:', { id: invite.id, invitedId: invite.invitedId });
      } else {
        seenInvitedIds.add(invite.invitedId);
      }
    }

    const updatedInvites = await prisma.invite.findMany({
      where: { inviterId: authUserId },
      select: { id: true, invitedId: true, invitedUsername: true },
    });
    const students = await prisma.student.findMany({
      where: { id: { in: updatedInvites.map((i) => i.invitedId) } },
      select: {
        id: true,
        username: true,
        discordUsername: true,
        discordId: true,
        signedUpToWebsite: true,
        stats: { select: { totalViews: true } },
      },
    });

    for (const invite of updatedInvites) {
      const student = students.find((s) => s.id === invite.invitedId);
      if (student && invite.invitedUsername !== student.username) {
        await prisma.invite.update({
          where: { id: invite.id },
          data: { invitedUsername: student.username },
        });
        console.log('Synced invite username:', { inviteId: invite.id, username: student.username });
      } else if (!student) {
        console.warn('No student found for invite:', { inviteId: invite.id, invitedId: invite.invitedId });
      }
    }

    const expectedCount = await prisma.invite.count({
      where: { inviterId: authUserId },
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
    console.log('Updated InviteStats:', { studentId: authUserId, count: expectedCount });

    for (const student of students) {
      const totalViews = student.stats.reduce((sum: number, stat: any) => sum + stat.totalViews, 0) || 0;
      if (totalViews >= 10000) {
        await prisma.invite.updateMany({
          where: { inviterId: authUserId, invitedId: student.id, status: { not: 'approved' } },
          data: { status: 'approved' },
        });
        console.log('Updated invite to approved:', { invitedId: student.id, totalViews });
      }
    }

    return NextResponse.json({ message: 'Sync completed', inviteCount: expectedCount });
  } catch (error: unknown) {
    console.error('Error syncing invites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}