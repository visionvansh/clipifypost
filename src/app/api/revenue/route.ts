import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  if (!studentId) {
    return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
  }

  try {
    const resultRecords = await prisma.result.findMany({
      where: { studentId },
      select: { revenue: true, createdAt: true },
    });

    return NextResponse.json(resultRecords);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}