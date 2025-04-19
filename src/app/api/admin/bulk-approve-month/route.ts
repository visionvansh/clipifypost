import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { month } = await req.json();

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Invalid or missing month (format: YYYY-MM)" },
        { status: 400 }
      );
    }

    const [year, monthNum] = month.split("-").map(Number);
    const startOfMonth = new Date(year, monthNum - 1, 1);
    const endOfMonth = new Date(year, monthNum, 1);

    // Fetch PENDING reels from ReelStatusHistory for the selected month
    const pendingReels = await prisma.reelStatusHistory.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          gte: startOfMonth,
          lt: endOfMonth,
        },
      },
      select: {
        reelId: true,
        views: true,
        reel: {
          select: { videoUrl: true, publishedUrl: true, views: true },
        },
      },
      distinct: ["reelId"], // Ensure unique reels
    });

    if (pendingReels.length === 0) {
      return NextResponse.json(
        { message: "No pending reels found for the selected month" },
        { status: 200 }
      );
    }

    // Prepare updates for reels
    const updates = pendingReels.map((r) => ({
      reelId: r.reelId,
      views: r.reel.views, // Use current views from userReel
      publishedUrl: r.reel.publishedUrl || r.reel.videoUrl || `https://default-url.com/reel/${r.reelId}`, // Fallback URL
    }));

    // Update reels to APPROVED and log in ReelStatusHistory
    await prisma.$transaction(async (tx) => {
      // Update userReel status to APPROVED and set publishedUrl
      await Promise.all(
        updates.map((u) =>
          tx.userReel.update({
            where: { id: u.reelId },
            data: {
              status: "APPROVED",
              publishedUrl: u.publishedUrl,
            },
          })
        )
      );

      // Log APPROVED status in ReelStatusHistory
      await tx.reelStatusHistory.createMany({
        data: updates.map((u) => ({
          reelId: u.reelId,
          status: "APPROVED",
          views: u.views,
        })),
      });
    });

    return NextResponse.json({
      message: `Approved ${updates.length} reels for ${month}`,
    });
  } catch (error) {
    console.error("Bulk approve month error:", error);
    return NextResponse.json(
      { error: "Failed to approve views for the month", details: String(error) },
      { status: 500 }
    );
  }
}