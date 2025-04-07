import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Fetch all revenue records (no studentId filter for admin)
    const resultRecords = await prisma.result.findMany({
      select: { revenue: true, createdAt: true },
    });

    return NextResponse.json(resultRecords);
  } catch (error) {
    console.error("Error fetching all revenue:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}