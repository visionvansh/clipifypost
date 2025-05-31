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
        company: {
          select: {
            rate: true,
          },
        },
        postedAt: true,
      },
    });

    // Calculate revenue for each clip and format it like Result records
    const resultRecords = clips.map((clip) => {
      const viewsValue = clip.views || 0;
      const rate = parseFloat(clip.company?.rate || "0");
      const revenue = (viewsValue / 100000) * rate;
      return {
        revenue: revenue.toString(),
        createdAt: clip.postedAt || new Date(), // Use postedAt or current date as fallback
      };
    });

    return NextResponse.json(resultRecords);
  } catch (error) {
    console.error("Error fetching revenue:", error);
    return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 });
  }
}