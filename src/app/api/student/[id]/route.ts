import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const authData = await auth();
    const userId = authData.userId;
    if (!userId || userId !== id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { id },
      select: {
        discordId: true,
        discordUsername: true,
        discordEmail: true,
        inviteLinks: {
          select: { inviteLink: true },
          take: 1,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      discordId: student.discordId,
      discordUsername: student.discordUsername,
      discordEmail: student.discordEmail,
      discordInviteLink: student.inviteLinks[0]?.inviteLink || null,
    });
  } catch (error: any) {
    console.error("Error fetching student data:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}