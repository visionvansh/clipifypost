import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");

    if (!userId || !month) {
      return NextResponse.json(
        { error: "Missing required fields: userId or month." },
        { status: 400 }
      );
    }

    // Check if payment exists for this user and month
    const payment = await prisma.payment.findUnique({
      where: {
        studentId_month: {
          studentId: userId,
          month: month,
        },
      },
    });

    return NextResponse.json({ isPaid: !!payment });
  } catch (error: any) {
    console.error("Error checking payment status:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to check payment status." }, { status: 500 });
  }
}