import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const announcement = await prisma.announcement.findUnique({
      where: { userId },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Payment details not found for this user." }, { status: 404 });
    }

    return NextResponse.json({
      paymentMethod: announcement.title,
      details: announcement.description,
    });
  } catch (error: any) {
    console.error("Error fetching payment details:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch payment details." }, { status: 500 });
  }
}