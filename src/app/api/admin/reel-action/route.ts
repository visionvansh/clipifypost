import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reelId, action, publishedUrl, views, disapprovalMessage } = await req.json();

    if (!reelId || !action) {
      return NextResponse.json(
        { error: "Missing reelId or action" },
        { status: 400 }
      );
    }

    const reel = await prisma.userReel.findUnique({
      where: { id: reelId },
      select: { views: true, publishedUrl: true, status: true },
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
          disapprovalMessage: null, // Clear disapproval message on approval
        },
      });

      await prisma.reelStatusHistory.create({
        data: {
          reelId,
          status: "APPROVED",
          views: updatedReel.views,
        },
      });

      return NextResponse.json({ message: "Reel approved", reel: updatedReel });
    } else if (action === "REJECT") {
      if (!disapprovalMessage) {
        return NextResponse.json(
          { error: "Disapproval message required" },
          { status: 400 }
        );
      }

      const updatedReel = await prisma.userReel.update({
        where: { id: reelId },
        data: { 
          status: "DISAPPROVED",
          disapprovalMessage,
          publishedUrl: null, // Clear published URL on disapproval
        },
      });

      await prisma.reelStatusHistory.create({
        data: {
          reelId,
          status: "DISAPPROVED",
          views: reel.views,
        },
      });

      return NextResponse.json({ message: "Reel disapproved", reel: updatedReel });
    } else if (action === "UPDATE_VIEWS") {
      const updatedReel = await prisma.userReel.update({
        where: { id: reelId },
        data: {
          views: views || 0,
        },
      });

      return NextResponse.json({ message: "Views updated", reel: updatedReel });
    } else if (action === "UPDATE_URL") {
      const updatedReel = await prisma.userReel.update({
        where: { id: reelId },
        data: {
          publishedUrl,
        },
      });

      return NextResponse.json({ message: "Published URL updated", reel: updatedReel });
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