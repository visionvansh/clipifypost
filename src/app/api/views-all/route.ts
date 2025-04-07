import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Fetch all views records (no studentId filter for admin)
    const attendanceRecords = await prisma.attendance.findMany({
      select: { views: true, createdAt: true },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching all views:", error);
    return NextResponse.json({ error: "Failed to fetch views" }, { status: 500 });
  }
}