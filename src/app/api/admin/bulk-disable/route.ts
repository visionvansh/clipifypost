import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.userReel.updateMany({
      data: { viewsLocked: true },
    });

    return NextResponse.json({ message: "Update buttons disabled for all users" });
  } catch (error) {
    console.error("Bulk disable error:", error);
    return NextResponse.json(
      { error: "Failed to disable update buttons", details: String(error) },
      { status: 500 }
    );
  }
}