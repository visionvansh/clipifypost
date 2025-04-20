import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { google, drive_v3 } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Readable } from "stream"; // Import Readable for Buffer to stream conversion

// Define credentials type for TypeScript
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
        { error: "Brand ID or file missing", details: "Required form fields not provided" },
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

    // Check for partial file
    if (file.size === 0) {
      console.log("Empty file received");
      return NextResponse.json(
        { error: "Empty or corrupted file", details: "Received file has zero size" },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    console.log("Converting file to Buffer");
    const arrayBuffer = await file.arrayBuffer();
    const fileData = Buffer.from(arrayBuffer);
    console.log("File converted to Buffer:", {
      bufferLength: fileData.length,
      fileSize: file.size,
    });

    // Verify buffer integrity
    if (fileData.length !== file.size) {
      console.log("Buffer size mismatch:", {
        bufferLength: fileData.length,
        fileSize: file.size,
      });
      return NextResponse.json(
        { error: "Corrupted file", details: "Buffer size does not match file size" },
        { status: 400 }
      );
    }

    // Convert Buffer to Readable stream
    const fileStream = Readable.from(fileData);

    // Initialize Google Drive authentication with JWT
    const credentials: ServiceAccountCredentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS!);
    const authClient = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    // Authorize the client
    await authClient.authorize();

    // Create Drive client
    const drive: drive_v3.Drive = google.drive({ version: "v3", auth: authClient });

    // Upload to Google Drive
    console.log("Starting upload to Google Drive");
    const fileName = `${uuidv4()}-${file.name}`;
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: file.type,
        body: fileStream, // Use Readable stream instead of Buffer
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
        brandId: parseInt(brandId),
        videoUrl,
        storageProvider: "google_drive",
        fileSize: file.size,
        status: "PENDING",
      },
    });

    console.log("Reel saved:", reel);

    return NextResponse.json({ message: "Reel uploaded", reel }, { status: 200 });
  } catch (error: any) {
    console.error("Upload error:", error.message, error.stack, {
      userAgent: req.headers.get("user-agent"),
      ip: req.ip,
    });
    return NextResponse.json(
      { error: "Upload failed", details: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}