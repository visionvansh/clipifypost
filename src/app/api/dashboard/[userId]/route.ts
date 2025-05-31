import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = await params;
  const { userId } = resolvedParams;
  const { userId: authUserId } = getAuth(request);

  if (userId !== authUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: userId },
      include: {
        inviteStats: true,
        sentInvites: { include: { invited: { select: { username: true, discordUsername: true, stats: true } } } },
        inviteLinks: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const inviteCount = student.inviteStats?.inviteCount || 0;
    const loggedInWebsite = await prisma.invite.count({
      where: { inviterId: userId, status: 'pending', invited: { discordId: { not: null } } },
    });
    const pendingUsers = await prisma.invite.findMany({
      where: { inviterId: userId, status: 'pending' },
      include: { invited: { select: { username: true, discordUsername: true, stats: true } } },
    });
    const approvedUsers = await prisma.invite.findMany({
      where: { inviterId: userId, status: 'approved' },
      include: { invited: { select: { username: true, discordUsername: true } } },
    });

    return NextResponse.json({
      discordUsername: student.discordUsername,
      inviteLink: student.inviteLinks[0]?.inviteLink,
      inviteCount,
      loggedInWebsite,
      pendingUsers: pendingUsers.map(p => ({
        clerkUsername: p.invited.username,
        discordUsername: p.invited.discordUsername,
        totalViews: p.invited.stats.reduce((sum: number, stat: any) => sum + stat.totalViews, 0),
      })),
      approvedUsers: approvedUsers.map(a => ({
        clerkUsername: a.invited.username,
        discordUsername: a.invited.discordUsername,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}