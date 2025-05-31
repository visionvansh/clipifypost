import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import sgMail from "@sendgrid/mail";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      console.error("[RESET-PASSWORD] CLERK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing CLERK_SECRET_KEY" },
        { status: 500 }
      );
    }

    if (!process.env.SENDGRID_API_KEY) {
      console.error("[RESET-PASSWORD] SENDGRID_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: Missing SENDGRID_API_KEY" },
        { status: 500 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({ emailAddress: [email] });
    if (!users.data.length) {
      console.log("[RESET-PASSWORD] Email not found:", email);
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    const user = users.data[0];

    // Check if valid OTP exists
    const existingOtp = await prisma.otp.findUnique({ where: { email } });
    if (existingOtp && new Date(existingOtp.expires) > new Date()) {
      console.log("[RESET-PASSWORD] Using existing OTP for user:", user.id, "OTP:", existingOtp.otp);
      return NextResponse.json(
        {
          success: true,
          message: "OTP code already sent, please check your email",
        },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in Prisma
    await prisma.otp.upsert({
      where: { email },
      update: { otp, expires },
      create: { email, otp, expires },
    });
    console.log("[RESET-PASSWORD] Generated OTP for user:", user.id, "OTP:", otp, "Expires:", expires);

    // Send OTP email using SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("[RESET-PASSWORD] Sending OTP email to:", email);
    const msg = {
      to: email, // Dynamic user-provided email
      from: "business@clipifypost.com", // Your verified SendGrid sender
      subject: "Password Reset OTP",
      text: `Your OTP code is: ${otp}. This code is valid for 10 minutes.`,
    };
    const mailResponse = await sgMail.send(msg);
    console.log("[RESET-PASSWORD] SendGrid response:", mailResponse);

    console.log("[RESET-PASSWORD] OTP email sent to:", email);
    return NextResponse.json(
      {
        success: true,
        message: "OTP code sent to your email, please check your inbox",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[RESET-PASSWORD] Error:", error.message, error.stack);
    const errorMessage =
      error.message.includes("not found")
        ? "Email not found"
        : error.message.includes("rate limit")
        ? "Too many requests, please try again later"
        : error.message || "Failed to send reset email";
    return NextResponse.json({ error: errorMessage }, { status: error.status || 500 });
  } finally {
    await prisma.$disconnect();
  }
}