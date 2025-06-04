import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const month = searchParams.get("month");

  if (!userId || !month) {
    return NextResponse.json({ error: "User ID and month are required" }, { status: 400 });
  }

  try {
    const earnings = await prisma.referralEarning.findFirst({
      where: { studentId: userId, month },
      select: { amount: true },
    });

    const totalPaid = earnings?.amount || 0;
    return NextResponse.json({ totalPaid });
  } catch (error) {
    console.error("Error fetching paid out:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

