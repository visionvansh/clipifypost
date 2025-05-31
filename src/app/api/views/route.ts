import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    // Fetch clips for the student through their accounts
    const clips = await prisma.clip.findMany({
      where: {
        account: {
          userId: studentId,
        },
        status: "approved", // Only fetch approved clips
      },
      select: {
        views: true,
        postedAt: true,
      },
    });

    // Format the response to match the Attendance records structure
    const attendanceRecords = clips.map((clip) => ({
      views: clip.views.toString(),
      createdAt: clip.postedAt || new Date(), // Use postedAt or current date as fallback
    }));

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching views:", error);
    return NextResponse.json({ error: "Failed to fetch views" }, { status: 500 });
  }
}