import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust path to your Prisma client

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Raw request body:", body);

    const { clerkUserId, username, email } = body;

    console.log("Parsed data:", { clerkUserId, username, email });

    if (!clerkUserId || !username || !email) {
      console.error("Missing required fields:", { clerkUserId, username, email });
      return NextResponse.json(
        { error: "Missing required fields", received: { clerkUserId, username, email } },
        { status: 400 }
      );
    }

    // Store in Student table
    console.log("Storing in Student table with ID:", clerkUserId);
    const student = await prisma.student.create({
      data: {
        id: clerkUserId,
        username,
        email,
        name: null,
        surname: null,
        phone: null,
        address: null,
        img: null,
        accounts: null,
        sex: null,
        platform: null,
        createdAt: new Date(),
      },
    });
    console.log("Student stored:", student);

    // Store in Result table
    console.log("Storing in Result table with ID:", clerkUserId);
    const result = await prisma.result.create({
      data: {
        id: clerkUserId,
        socialAccountName: "N/A",
        nameOfPerson: username,
        revenue: "0",
        studentId: clerkUserId,
      },
    });
    console.log("Result stored:", result);

    // Store in Attendance table with clerkUserId as ID
    console.log("Storing in Attendance table with ID:", clerkUserId);
    const attendance = await prisma.attendance.create({
      data: {
        id: clerkUserId, // Directly set clerkUserId as ID
        socialAccountName: "N/A",
        nameOfPerson: username,
        views: "0",
        studentId: clerkUserId,
      },
    });
    console.log("Attendance stored:", attendance);

    return NextResponse.json(
      { success: true, student, result, attendance },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Database error details:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to store data in database", details: error.message },
      { status: 500 }
    );
  }
}