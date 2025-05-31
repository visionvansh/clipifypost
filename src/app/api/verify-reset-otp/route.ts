import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("[VERIFY-RESET-OTP] CLERK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing CLERK_SECRET_KEY" },
        { status: 500 }
      );
    }

    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { error: "Email, OTP, and new password are required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "Invalid 6-digit OTP code" }, { status: 400 });
    }

    // Stricter password validation
    if (newPassword.length < 12) {
      return NextResponse.json(
        { error: "Password must be at least 12 characters long" },
        { status: 400 }
      );
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      return NextResponse.json(
        { error: "Password must contain both letters and numbers" },
        { status: 400 }
      );
    }

    // Check OTP
    const storedOtp = await prisma.otp.findUnique({ where: { email } });
    console.log("[VERIFY-RESET-OTP] Stored OTP:", storedOtp, "Received OTP:", otp, "Time:", Date.now());
    if (!storedOtp || storedOtp.otp !== otp || new Date(storedOtp.expires) < new Date()) {
      console.log("[VERIFY-RESET-OTP] Invalid or expired OTP for email:", email);
      return NextResponse.json({ error: "Invalid or expired OTP code" }, { status: 400 });
    }

    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    if (!users.data.length) {
      console.log("[VERIFY-RESET-OTP] Email not found:", email);
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const user = users.data[0];

    console.log("[VERIFY-RESET-OTP] Updating password for user:", user.id);
    try {
      await clerk.users.updateUser(user.id, { password: newPassword });
    } catch (clerkError: any) {
      console.error("[VERIFY-RESET-OTP] Clerk error:", clerkError);
      if (clerkError.status === 422 && clerkError.errors) {
        const errorMessage = clerkError.errors[0]?.message || "Invalid password format";
        return NextResponse.json({ error: errorMessage }, { status: 422 });
      }
      throw clerkError; // Re-throw other errors
    }

    // Clear OTP
    await prisma.otp.delete({ where: { email } });
    console.log("[VERIFY-RESET-OTP] Password reset successful for user:", user.id);

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successful, please sign in",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[VERIFY-RESET-OTP] Error:", error.message, error.stack);
    const errorMessage =
      error.message.includes("not found")
        ? "Email not found"
        : error.message.includes("rate limit")
        ? "Too many requests, please try again later"
        : error.message || "Failed to verify OTP";
    return NextResponse.json({ error: errorMessage }, { status: error.status || 500 });
  } finally {
    await prisma.$disconnect();
  }
}