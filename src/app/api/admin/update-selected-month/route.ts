import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId: requestUserId, selectedMonth } = await req.json();

    if (requestUserId !== userId) {
      return NextResponse.json({ error: "Forbidden: User ID mismatch" }, { status: 403 });
    }

    if (!selectedMonth || typeof selectedMonth !== "string") {
      return NextResponse.json({ error: "Invalid selectedMonth" }, { status: 400 });
    }

    if (!process.env.CLERK_SECRET_KEY) {
      console.error("CLERK_SECRET_KEY is not defined");
      return NextResponse.json(
        { error: "Server configuration error: Missing Clerk secret key" },
        { status: 500 }
      );
    }

    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    await clerkClient.users.updateUser(userId, {
      publicMetadata: { selectedMonth },
    });

    return NextResponse.json({ message: "Selected month updated successfully" });
  } catch (error: any) {
    console.error("Update selected month error:", error.message, error);
    return NextResponse.json(
      { error: `Failed to update selected month: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}