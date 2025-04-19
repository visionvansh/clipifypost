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
      data: { viewsLocked: false },
    });

    return NextResponse.json({ message: "Update buttons enabled for all users" });
  } catch (error) {
    console.error("Bulk enable error:", error);
    return NextResponse.json(
      { error: "Failed to enable update buttons", details: String(error) },
      { status: 500 }
    );
  }
}