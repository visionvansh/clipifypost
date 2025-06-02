import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { discordId, username, inviteCode } = await request.json();
    console.log('Received request at /api/update-students:', { discordId, username, inviteCode });

    const apiKey = request.headers.get('Authorization')?.split('Bearer ')[1];
    if (apiKey !== process.env.API_KEY) {
      console.error('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let student = await prisma.student.findFirst({
      where: { discordId },
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          id: `discord_${discordId}`,
          username: username || `discord_${discordId}`,
          discordId,
          discordUsername: username,
          email: `discord_${discordId}@example.com`,
          signedUpToWebsite: false,
        },
      });
      console.log('Created new student:', student);
    } else {
      await prisma.student.update({
        where: { id: student.id },
        data: {
          discordUsername: username,
        },
      });
      console.log('Updated student:', student);
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
            console.log('Created new invite:', { inviterId: inviter.id, invitedId: student.id });

            // NEW: Update InviteStats for inviter
            const inviteCount = await prisma.invite.count({
              where: { inviterId: inviter.id },
            });
            await prisma.inviteStats.upsert({
              where: { studentId: inviter.id },
              update: { inviteCount, updatedAt: new Date() },
              create: {
                studentId: inviter.id,
                inviteCount,
                updatedAt: new Date(),
              },
            });
            console.log('Updated InviteStats:', { studentId: inviter.id, inviteCount });
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