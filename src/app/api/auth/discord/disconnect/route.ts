import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { userId: authUserId } = await auth();

    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update student to clear Discord data
    const student = await prisma.student.update({
      where: { id: authUserId },
      data: {
        discordId: null,
        discordUsername: null,
        discordEmail: null,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete associated invite links
    await prisma.inviteLink.deleteMany({
      where: { studentId: authUserId },
    });

    return NextResponse.json({ message: 'Discord disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting Discord:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}