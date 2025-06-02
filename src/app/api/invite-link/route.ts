import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const inviteCode = url.searchParams.get('inviteCode');
    console.log('Received request at /api/invite-link:', { inviteCode });

    const apiKey = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (apiKey !== process.env.API_KEY) {
      console.error('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!inviteCode) {
      return NextResponse.json({ error: 'Missing inviteCode' }, { status: 400 });
    }

    const inviteLink = await prisma.inviteLink.findFirst({
      where: { inviteCode },
      include: { student: true },
    });

    if (!inviteLink) {
      return NextResponse.json({ error: 'Invite link not found' }, { status: 404 });
    }

    return NextResponse.json({
      threadId: inviteLink.threadId,
      discordUsername: inviteLink.student.discordUsername,
    });
  } catch (error) {
    console.error('Error fetching invite link:', error);
    return NextResponse.json({ error: 'Failed to fetch invite link' }, { status: 500 });
  }
}