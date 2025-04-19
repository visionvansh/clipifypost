import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/backend";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId: requestUserId, allowUpdates } = await req.json();

    if (requestUserId !== userId) {
      return NextResponse.json({ error: "Forbidden: User ID mismatch" }, { status: 403 });
    }

    if (typeof allowUpdates !== "boolean") {
      return NextResponse.json({ error: "Invalid allowUpdates value" }, { status: 400 });
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
      publicMetadata: { allowUpdates },
    });

    return NextResponse.json({ message: "Allow updates updated successfully" });
  } catch (error: any) {
    console.error("Update allow updates error:", error.message, error);
    return NextResponse.json(
      { error: `Failed to update allow updates: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}