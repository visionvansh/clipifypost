import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { google } from "googleapis";
import { Readable } from "stream";
import { v4 as uuidv4 } from "uuid";
import twilio from "twilio";

export async function POST(req: NextRequest) {
  const logWithTimestamp = (message: string, data: any = {}) => {
    console.log(`[${new Date().toISOString()}] ${message}`, {
      ...data,
      environment: process.env.NODE_ENV || "unknown",
    });
  };

  logWithTimestamp("API /upload-reel called", {
    userAgent: req.headers.get("user-agent"),
    ip: req.ip,
  });

  try {
    // Authenticate user
    logWithTimestamp("Authenticating user");
    const { userId } = await auth();
    if (!userId) {
      logWithTimestamp("Unauthorized access");
      return NextResponse.json(
        { error: "Unauthorized", details: "No user authenticated" },
        { status: 401 }
      );
    }
    logWithTimestamp("User authenticated", { userId });

    // Get Clerk user details from Student model
    logWithTimestamp("Fetching student username");
    const student = await prisma.student.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    const username = student?.username || "Unknown";
    logWithTimestamp("Student username fetched", { username });

    // Get form data
    logWithTimestamp("Parsing form data");
    const formData = await req.formData();
    const file = formData.get("reel") as File;
    const brandId = formData.get("brandId");

    if (!file || !brandId) {
      logWithTimestamp("Missing file or brandId", { hasFile: !!file, brandId });
      return NextResponse.json(
        { error: "Missing required fields", details: "File or Brand ID not provided" },
        { status: 400 }
      );
    }

    // Validate brandId
    const parsedBrandId = parseInt(brandId as string);
    if (isNaN(parsedBrandId)) {
      logWithTimestamp("Invalid brandId", { brandId });
      return NextResponse.json(
        { error: "Invalid brandId", details: "Brand ID must be a number" },
        { status: 400 }
      );
    }

    // Validate file
    const maxSize = 600 * 1024 * 1024; // 600MB
    if (file.size > maxSize) {
      logWithTimestamp("File size exceeds limit", { size: file.size });
      return NextResponse.json(
        { error: "File too large", details: "File size exceeds 600MB" },
        { status: 400 }
      );
    }

    const allowedTypes = ["video/mp4", "video/webm", "video/mpeg"];
    if (!allowedTypes.includes(file.type)) {
      logWithTimestamp("Invalid file type", { type: file.type });
      return NextResponse.json(
        { error: "Invalid file type", details: "Only MP4, WebM, or MPEG allowed" },
        { status: 400 }
      );
    }

    // Initialize Google Drive
    logWithTimestamp("Initializing Google Drive client");
    const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || "{}");
    const authClient = new google.auth.JWT(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ["https://www.googleapis.com/auth/drive"],
    );
    const drive = google.drive({ version: "v3", auth: authClient });
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || "";

    // Upload to Google Drive
    logWithTimestamp("Uploading file to Google Drive", { fileName: file.name });
    const fileMeta = {
      name: `${uuidv4()}_${file.name}`,
      parents: [folderId],
    };

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: fileMeta,
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id, webViewLink",
    });

    const fileId = response.data.id;
    const videoUrl = response.data.webViewLink;

    if (!fileId || !videoUrl) {
      logWithTimestamp("Google Drive upload failed", { response });
      return NextResponse.json(
        { error: "Upload failed", details: "Failed to upload to Google Drive" },
        { status: 500 }
      );
    }

    logWithTimestamp("File uploaded to Google Drive", { fileId, videoUrl });

    // Save to Prisma
    logWithTimestamp("Saving reel to Prisma");
    const reel = await prisma.userReel.create({
      data: {
        studentId: userId,
        brandId: parsedBrandId,
        videoUrl,
        fileSize: file.size,
        storageProvider: "google_drive",
        status: "PENDING",
      },
    });
    logWithTimestamp("Reel saved", { reelId: reel.id });

    // Send WhatsApp notification to both numbers
    logWithTimestamp("Sending WhatsApp notifications");
    const twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
    const secondaryNumber = process.env.SECONDARY_WHATSAPP_NUMBER;
    const numbers = [adminNumber, secondaryNumber].filter(Boolean) as string[];

    if (!numbers.length) {
      logWithTimestamp("Skipping WhatsApp notifications: No valid numbers set", {
        adminNumber,
        secondaryNumber,
      });
    } else if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      logWithTimestamp("Skipping WhatsApp notifications: Twilio credentials missing");
    } else {
      const timestamp = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      });

      for (const number of numbers) {
        try {
          await twilioClient.messages.create({
            body: `User ${username} uploaded a video at ${timestamp}`,
            from: "whatsapp:+14155238886",
            to: `whatsapp:${number}`,
          });
          logWithTimestamp("WhatsApp notification sent", { username, timestamp, to: number });
        } catch (twilioError: any) {
          logWithTimestamp("Failed to send WhatsApp notification", {
            error: twilioError.message,
            to: number,
          });
        }
      }
    }

    return NextResponse.json({ message: "Reel uploaded", reel }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    logWithTimestamp("Upload error", {
      message: errorMessage,
      stack: errorStack,
      userAgent: req.headers.get("user-agent"),
      ip: req.ip,
    });
    return NextResponse.json(
      { error: "Upload failed", details: errorMessage || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}