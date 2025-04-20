import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream";

// Define credentials type
interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

export async function POST(req: NextRequest) {
  console.log("API /upload-reel called", {
    userAgent: req.headers.get("user-agent"),
    ip: req.ip,
  });

  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      console.log("Unauthorized access");
      return NextResponse.json(
        { error: "Unauthorized", details: "No user authenticated" },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await req.formData();
    const brandId = formData.get("brandId") as string;
    const file = formData.get("reel") as File;

    console.log("Form parsed:", {
      brandId,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    });

    if (!brandId || !file) {
      console.log("Missing brandId or file:", { brandId, file });
      return NextResponse.json(
        { error: "Missing required fields", details: "Brand ID or file not provided" },
        { status: 400 }
      );
    }

    // Validate brandId
    const parsedBrandId = parseInt(brandId);
    if (isNaN(parsedBrandId)) {
      console.log("Invalid brandId:", brandId);
      return NextResponse.json(
        { error: "Invalid brandId", details: "Brand ID must be a number" },
        { status: 400 }
      );
    }

    // Validate file size (600MB = 600 * 1024 * 1024 bytes)
    const maxSize = 600 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log("File too large:", file.size);
      return NextResponse.json(
        { error: "File too large", details: "File exceeds 600MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/mpeg"];
    if (!allowedTypes.includes(file.type)) {
      console.log("Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Invalid file type", details: "Please upload MP4, WebM, or MPEG videos" },
        { status: 400 }
      );
    }

    // Check for empty file
    if (file.size === 0) {
      console.log("Empty file received");
      return NextResponse.json(
        { error: "Empty file", details: "Received file has zero size" },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    console.log("Converting file to Buffer");
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    console.log("File converted to Buffer:", {
      bufferLength: fileBuffer.length,
      fileSize: file.size,
    });

    // Verify buffer integrity
    if (fileBuffer.length !== file.size) {
      console.log("Buffer size mismatch:", {
        bufferLength: fileBuffer.length,
        fileSize: file.size,
      });
      return NextResponse.json(
        { error: "Corrupted file", details: "Buffer size does not match file size" },
        { status: 400 }
      );
    }

    // Create a Readable stream from Buffer
    console.log("Creating Readable stream from Buffer");
    const fileStream = Readable.from(fileBuffer);

    const fileName = `${uuidv4()}-${file.name}`;

    // Initialize Google Drive authentication
    const credentials: ServiceAccountCredentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || "{}");
    if (!credentials.client_email || !credentials.private_key) {
      console.log("Invalid Google Drive credentials");
      return NextResponse.json(
        { error: "Server configuration error", details: "Invalid Google Drive credentials" },
        { status: 500 }
      );
    }

    const authClient = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });

    // Authorize client
    await authClient.authorize();
    console.log("Google Drive auth successful");

    // Create Drive client
    const drive = google.drive({ version: "v3", auth: authClient });

    // Upload to Google Drive
    console.log("Starting upload to Google Drive:", { fileName, fileSize: file.size });
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ""],
      },
      media: {
        mimeType: file.type,
        body: fileStream, // Use Readable stream
      },
      fields: "id, webViewLink",
    });

    console.log("Upload result:", response.data);

    const videoUrl = response.data.webViewLink;
    if (!videoUrl) {
      console.error("Invalid videoUrl:", videoUrl);
      throw new Error("Failed to obtain valid video URL from Google Drive");
    }

    // Save to Prisma
    const reel = await prisma.userReel.create({
      data: {
        studentId: userId,
        brandId: parsedBrandId,
        videoUrl,
        storageProvider: "google_drive",
        fileSize: file.size,
        status: "PENDING",
      },
    });

    console.log("Reel saved:", reel);

    return NextResponse.json({ message: "Reel uploaded", reel }, { status: 200 });
  } catch (error: any) {
    console.error("Upload error:", {
      message: error.message,
      stack: error.stack,
      details: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      userAgent: req.headers.get("user-agent"),
      ip: req.ip,
    });
    return NextResponse.json(
      { error: "Upload failed", details: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}