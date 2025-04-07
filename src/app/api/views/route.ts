import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
      select: { views: true, createdAt: true },
    });

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching views:", error);
    return NextResponse.json({ error: "Failed to fetch views" }, { status: 500 });
  }
}