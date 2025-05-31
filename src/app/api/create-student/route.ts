import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    // Fetch Clerk user ID
    const authData = await auth();
    const clerkUserId = authData.userId;
    if (!clerkUserId) {
      console.error("Clerk user ID not found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, email } = await req.json();

    if (!username || !email) {
      console.error("Missing username or email in request");
      return NextResponse.json({ error: "Missing username or email" }, { status: 400 });
    }

    console.log(`Creating student for Clerk user: ${clerkUserId}`);

    // Create or update Student record
    const student = await prisma.student.upsert({
      where: { id: clerkUserId },
      update: {
        username,
        email,
        signedUpToWebsite: true,
      },
      create: {
        id: clerkUserId,
        username,
        email,
        signedUpToWebsite: true,
      },
    });

    // Create UserStatsRecord for the current month
    const currentMonth = new Date().toISOString().slice(0, 7); // e.g., "2025-05"
    const existingStats = await prisma.userStatsRecord.findUnique({
      where: {
        userId_month: {
          userId: student.id,
          month: currentMonth,
        },
      },
    });

    if (!existingStats) {
      console.log(`Creating UserStatsRecord for student: ${student.id}, month: ${currentMonth}`);
      await prisma.userStatsRecord.create({
        data: {
          id: `${student.id}_${currentMonth}`,
          userId: student.id,
          username: student.username || "Unknown",
          clerkUserId: student.id,
          clerkUsername: student.username || "Unknown",
          month: currentMonth,
          uploadersHubViews: 0,
          uploadersHubRevenue: 0,
          editorsHubViews: 0,
          editorsHubRevenue: 0,
          totalViews: 0,
          totalRevenue: 0,
        },
      });
    }

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error("Error in /api/create-student:", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}