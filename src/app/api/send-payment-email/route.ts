import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import sgMail from "@sendgrid/mail";

// Debug: Log the API key to ensure it's loaded
console.log("SendGrid API Key:", process.env.SENDGRID_API_KEY);

// Set SendGrid API Key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is not defined in .env file.");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { userId, month, totalRevenue } = await request.json();

    if (!userId || !month || totalRevenue === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: userId, month, or totalRevenue." },
        { status: 400 }
      );
    }

    // Fetch the student's email from Clerk
    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: { email: true, username: true },
    });

    if (!student || !student.email) {
      return NextResponse.json({ error: "Student or email not found." }, { status: 404 });
    }

    // Check if payment already exists for this student and month
    const existingPayment = await prisma.payment.findUnique({
      where: {
        studentId_month: {
          studentId: userId,
          month: month,
        },
      },
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment already processed for this month." },
        { status: 409 } // Conflict status code
      );
    }

    // Debug: Log the email details before sending
    console.log("Sending email with details:", {
      to: student.email,
      from: "business@clipifypost.com", // Replace with your verified sender email
      subject: "Payment Confirmation from Clipify Post",
    });

    // Convert month (e.g., "2025-05") to readable format (e.g., "May 2025")
    const monthDate = new Date(`${month}-01`);
    const formattedMonth = monthDate.toLocaleString("en-US", { month: "long", year: "numeric" });

    // HTML email template with updated logo (smaller size, circular shape)
    const htmlContent = `
      <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <!-- Header with Logo -->
        <div style="text-align: center; padding-bottom: 20px;">
          <img src="https://instagram.fknu1-3.fna.fbcdn.net/v/t51.2885-19/494420827_17865809820379363_7174285822831955811_n.jpg?_nc_ht=instagram.fknu1-3.fna.fbcdn.net&_nc_cat=107&_nc_oc=Q6cZ2QHvUF_OoVDCrrkvdi5w5zx-P1RxJKxdZfxzkuRt8RIkiyLyBqo4O-WahUr1Pcjekyg&_nc_ohc=83lGUlgVNbQQ7kNvwGOYfXO&_nc_gid=yz8tsVmFdTl2SEwMhxVvgA&edm=AP4sbd4BAAAA&ccb=7-5&oh=00_AfLHT8Omk2_lS3FEdXEK6lMUWdPBgKN1aY-n6ljI8SkCcA&oe=68305EF6&_nc_sid=7a9f4b" alt="Clipify Post Logo" style="max-width: 120px; border-radius: 50%; object-fit: cover;" />
        </div>

        <!-- Title -->
        <h2 style="color: #000000; text-align: center; font-size: 28px; margin: 0;">
          🎉 Payment Confirmation 🎉
        </h2>

        <!-- Greeting -->
        <p style="font-size: 18px; color: #333333; text-align: center; margin: 20px 0;">
          Hello <strong style="color: #000000;">${student.username}</strong> 💼,
        </p>

        <!-- Main Message -->
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <p style="font-size: 16px; color: #333333; margin: 0;">
            We’re thrilled to let you know that your payment of
            <strong style="font-size: 20px; color: #000000;">$${totalRevenue.toLocaleString(
              undefined,
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}</strong>
            for <strong>${formattedMonth}</strong> has been successfully processed! 🤑💸
          </p>
        </div>

        <!-- Thank You Note -->
        <p style="font-size: 16px; color: #333333; text-align: center;">
          Thank you for your amazing contributions to Clipify Post! Keep shining and creating awesome content! 🌟🚀
        </p>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
          <p style="font-size: 14px; color: #333333; margin: 0;">
            Warm regards,<br />
            <strong>The Clipify Post Team</strong> 
          </p>
          <p style="font-size: 14px; color: #555555; margin-top: 10px;">
            Founder - Jalen Chambliss<br />
            Co-Founder - Vansh Singh
          </p>
        </div>
      </div>
    `;

    // Send email using SendGrid
    const msg = {
      to: student.email,
      from: "business@clipifypost.com", // Replace with your verified sender email
      replyTo: "business@clipifypost.com", // Replace with a verified email or remove temporarily
      subject: "Payment Confirmation from Clipify Post ✨",
      text: `Dear ${student.username},\nYou received your payment of $${totalRevenue.toLocaleString(
        undefined,
        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      )} for ${formattedMonth}.\nThank you,\nClipify Post`,
      html: htmlContent,
    };

    const sendResult = await sgMail.send(msg);
    console.log(`Payment email sent to ${student.email} for $${totalRevenue}`, sendResult);

    // Save the payment record in the database
    await prisma.payment.create({
      data: {
        studentId: userId,
        month: month,
        amount: totalRevenue,
      },
    });

    return NextResponse.json({ message: "Payment email sent successfully." });
  } catch (error: any) {
    console.error("Error sending payment email:", error.message, error.stack);
    if (error.response) {
      console.error("SendGrid Error Response:", error.response.body);
    }
    return NextResponse.json({ error: "Failed to send payment email." }, { status: 500 });
  }
}