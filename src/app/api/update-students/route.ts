import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { discordId, username, inviteCode } = await request.json();

    const apiKey = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let student = await prisma.student.findFirst({
      where: { discordId },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          id: `discord_${discordId}`,
          username: username || `discord_${discordId}`,  // Added username field
          discordId,
          discordUsername: username,
          email: `discord_${discordId}@example.com`,
          signedUpToWebsite: false,
        },
      });
    } else {
      await prisma.student.update({
        where: { id: student.id },
        data: {
          discordUsername: username,
        },
      });
    }

    if (inviteCode) {
      const inviteLink = await prisma.inviteLink.findFirst({
        where: { inviteCode },
      });

      if (inviteLink) {
        const inviter = await prisma.student.findUnique({
          where: { id: inviteLink.studentId },
        });

        if (inviter) {
          const existingInvite = await prisma.invite.findFirst({
            where: {
              inviterId: inviter.id,
              invitedId: student.id,
            },
          });

          if (!existingInvite) {
            await prisma.invite.create({
              data: {
                inviterId: inviter.id,
                invitedId: student.id,
                invitedUsername: username,
                status: 'pending',
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}