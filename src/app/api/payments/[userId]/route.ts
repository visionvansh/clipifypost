import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: User ka payment data fetch karo
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').pop();
  if (!userId) {
    return new NextResponse("User ID not provided", { status: 400 });
  }
  try {
    const announcement = await prisma.announcement.findUnique({
      where: { userId: userId },
    });
    console.log(`GET Response for ${userId}:`, announcement); // Debug
    if (announcement) {
      return NextResponse.json(announcement);
    } else {
      return NextResponse.json({ error: "Payment data not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment data", details: String(error) },
      { status: 500 }
    );
  }
}

// PUT: Payment data ko save ya update karo
export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const userId = url.pathname.split('/').pop();
  if (!userId) {
    return new NextResponse("User ID not provided", { status: 400 });
  }
  try {
    const { title, description } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.upsert({
      where: { userId: userId },
      update: {
        title,
        description, // Removed date
      },
      create: {
        userId: userId,
        title,
        description, // Removed date
      },
    });

    console.log(`PUT Response for ${userId}:`, announcement); // Debug
    return NextResponse.json({
      success: true,
      message: "Payment data saved successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { error: "Failed to save payment data", details: String(error) },
      { status: 500 }
    );
  }
}