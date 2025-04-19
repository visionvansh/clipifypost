import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reelId, action, publishedUrl, views } = await req.json();

    if (!reelId || !action) {
      return NextResponse.json(
        { error: "Missing reelId or action" },
        { status: 400 }
      );
    }

    const reel = await prisma.userReel.findUnique({
      where: { id: reelId },
      select: { views: true, publishedUrl: true },
    });

    if (!reel) {
      return NextResponse.json({ error: "Reel not found" }, { status: 404 });
    }

    if (action === "APPROVE") {
      if (!publishedUrl) {
        return NextResponse.json(
          { error: "Published URL required for approval" },
          { status: 400 }
        );
      }

      const updatedReel = await prisma.userReel.update({
        where: { id: reelId },
        data: {
          status: "APPROVED",
          publishedUrl,
          views: views || reel.views,
        },
      });

      // Log status change with current views
      await prisma.reelStatusHistory.create({
        data: {
          reelId,
          status: "APPROVED",
          views: updatedReel.views, // Use updated views
        },
      });

      return NextResponse.json({ message: "Reel approved", reel: updatedReel });
    } else if (action === "REJECT") {
      const updatedReel = await prisma.userReel.update({
        where: { id: reelId },
        data: { status: "DISAPPROVED" },
      });

      // Log status change with current views
      await prisma.reelStatusHistory.create({
        data: {
          reelId,
          status: "DISAPPROVED",
          views: reel.views, // Use views before update
        },
      });

      return NextResponse.json({ message: "Reel rejected", reel: updatedReel });
    } else if (action === "UPDATE_VIEWS") {
      const updatedReel = await prisma.userReel.update({
        where: { id: reelId },
        data: {
          views: views || 0,
        },
      });

      return NextResponse.json({ message: "Views updated", reel: updatedReel });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Reel action error:", error);
    return NextResponse.json(
      { error: "Failed to process action", details: String(error) },
      { status: 500 }
    );
  }
}