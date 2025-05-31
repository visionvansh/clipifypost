import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clerkUserId, username, email } = body;

    // Validate inputs
    if (!clerkUserId || !username || !email) {
      return NextResponse.json(
        { error: "Missing required fields", received: { clerkUserId, username, email } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate username (e.g., 3-20 characters, alphanumeric)
    if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9]+$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters and alphanumeric" },
        { status: 400 }
      );
    }

    // Use Prisma transaction for atomic operations
    const [student, result, attendance] = await prisma.$transaction([
      prisma.student.create({
        data: {
          id: clerkUserId,
          username,
          email,
          name: null,
          surname: null,
          phone: null,
          address: null,
          img: null,
          sex: null,
          platform: null,
          createdAt: new Date(),
        },
      }),
      prisma.result.create({
        data: {
          id: clerkUserId,
          socialAccountName: "N/A",
          nameOfPerson: username,
          revenue: "0",
          studentId: clerkUserId,
        },
      }),
      prisma.attendance.create({
        data: {
          id: clerkUserId,
          socialAccountName: "N/A",
          nameOfPerson: username,
          views: "0",
          studentId: clerkUserId,
        },
      }),
    ]);

    return NextResponse.json(
      { success: true, student, result, attendance },
      { status: 200 }
    );
  } catch (error: any) {
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email or username already exists in database" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to store data in database", details: error.message },
      { status: 500 }
    );
  }
}