import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reelId, views } = await req.json();

    if (!reelId || views === undefined) {
      return NextResponse.json(
        { error: "Missing reelId or views" },
        { status: 400 }
      );
    }

    const reel = await prisma.userReel.findUnique({
      where: { id: reelId },
      select: { studentId: true, viewsLocked: true, status: true, views: true },
    });

    if (!reel || reel.studentId !== userId) {
      return NextResponse.json(
        { error: "Reel not found or unauthorized" },
        { status: 403 }
      );
    }

    if (reel.viewsLocked) {
      return NextResponse.json(
        { error: "Views update is locked" },
        { status: 403 }
      );
    }

    if (reel.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Only approved reels can update views" },
        { status: 400 }
      );
    }

    const updatedReel = await prisma.userReel.update({
      where: { id: reelId },
      data: {
        views: views || 0,
        status: "PENDING",
      },
    });

    // Log status change with current views (before update)
    await prisma.reelStatusHistory.create({
      data: {
        reelId,
        status: "PENDING",
        views: reel.views, // Use views before update
      },
    });

    return NextResponse.json({ message: "Views updated, reel set to pending", reel: updatedReel });
  } catch (error) {
    console.error("Update views error:", error);
    return NextResponse.json(
      { error: "Failed to update views", details: String(error) },
      { status: 500 }
    );
  }
}