import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export async function POST(request: NextRequest) {
  const { userId, month, paymentAmount } = await request.json();

  if (!userId || !month || !paymentAmount || isNaN(Number(paymentAmount)) || paymentAmount <= 0) {
    return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
  }

  try {
    const user = await prisma.student.findUnique({
      where: { id: userId },
      select: { email: true, discordUsername: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const invites = await prisma.invite.findMany({
      where: { inviterId: userId, status: "approved" },
      include: { invited: { select: { signedUpToWebsite: true } } },
    });

    const approvedCount = invites.filter((invite) => invite.invited.signedUpToWebsite).length;
    const totalPayout = approvedCount * 0.5;

    const existingEarnings = await prisma.referralEarning.findFirst({
      where: { studentId: userId, month },
      select: { amount: true },
    });

    const totalPaid = existingEarnings?.amount || 0;
    if (paymentAmount > totalPayout - totalPaid) {
      return NextResponse.json({ error: "Payment amount exceeds remaining payout" }, { status: 400 });
    }

    await prisma.referralEarning.upsert({
      where: { studentId_invitedId: { studentId: userId, invitedId: userId } },
      update: { amount: { increment: paymentAmount }, month },
      create: {
        studentId: userId,
        invitedId: userId,
        amount: paymentAmount,
        month,
      },
    });

    const msg = {
      to: user.email,
      from: process.env.SENDGRID_FROM_EMAIL || "business@clipifypost.com",
      subject: "Referral Payment Received from ClipifyPost",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; background-color: #000; padding: 20px;">
          <img src="https://your-logo-url.com/logo.png" alt="ClipifyPost Logo" style="width: 150px; display: block; margin: 0 auto;" />
          <h2 style="color: #fff; text-align: center;">Referral Payment Received!</h2>
          <p style="color: #fff; text-align: center;">
            You got paid <strong>$${paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> from referral.
          </p>
          <p style="color: #fff; text-align: center;">
            Keep inviting more users to earn more rewards!
          </p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      console.log(`Email sent to ${user.email} for $${paymentAmount}`);
    } catch (emailError: any) {
      console.error("SendGrid error:", emailError.response?.body || emailError.message);
      return NextResponse.json({ error: "Failed to send email, but payment recorded" }, { status: 500 });
    }

    return NextResponse.json({ message: "Payment processed and email sent successfully" });
  } catch (error: any) {
    console.error("Error processing payment:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}