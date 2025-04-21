import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { google } from "googleapis";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { Readable } from "stream";

// Define credentials type
interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

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

    // Get form data
    logWithTimestamp("Parsing form data");
    const formData = await req.formData();
    const brandId = formData.get("brandId") as string;
    const file = formData.get("reel") as File;

    logWithTimestamp("Form parsed", {
      brandId,
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file?.size,
    });

    if (!brandId || !file) {
      logWithTimestamp("Missing brandId or file", { brandId, file });
      return NextResponse.json(
        { error: "Missing required fields", details: "Brand ID or file not provided" },
        { status: 400 }
      );
    }

    // Validate brandId
    const parsedBrandId = parseInt(brandId);
    if (isNaN(parsedBrandId)) {
      logWithTimestamp("Invalid brandId", { brandId });
      return NextResponse.json(
        { error: "Invalid brandId", details: "Brand ID must be a number" },
        { status: 400 }
      );
    }

    // Validate file size (600MB = 600 * 1024 * 1024 bytes)
    const maxSize = 600 * 1024 * 1024;
    if (file.size > maxSize) {
      logWithTimestamp("File too large", { fileSize: file.size });
      return NextResponse.json(
        { error: "File too large", details: "File exceeds 600MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["video/mp4", "video/webm", "video/mpeg"];
    if (!allowedTypes.includes(file.type)) {
      logWithTimestamp("Invalid file type", { fileType: file.type });
      return NextResponse.json(
        { error: "Invalid file type", details: "Please upload MP4, WebM, or MPEG videos" },
        { status: 400 }
      );
    }

    // Check for empty file
    if (file.size === 0) {
      logWithTimestamp("Empty file received");
      return NextResponse.json(
        { error: "Empty file", details: "Received file has zero size" },
        { status: 400 }
      );
    }

    // Get ArrayBuffer directly
    logWithTimestamp("Converting file to ArrayBuffer");
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    logWithTimestamp("File converted to Uint8Array", {
      dataLength: fileData.length,
      fileSize: file.size,
    });

    // Verify data integrity
    if (fileData.length !== file.size) {
      logWithTimestamp("Data size mismatch", {
        dataLength: fileData.length,
        fileSize: file.size,
      });
      return NextResponse.json(
        { error: "Corrupted file", details: "Data size does not match file size" },
        { status: 400 }
      );
    }

    // Save file temporarily
    const tempFilePath = path.join(process.cwd(), "tmp", `${uuidv4()}-${file.name}`);
    logWithTimestamp("Saving temporary file", { tempFilePath });
    try {
      await fsPromises.mkdir(path.dirname(tempFilePath), { recursive: true });
      await fsPromises.writeFile(tempFilePath, fileData);
      logWithTimestamp("Temporary file saved", { tempFilePath });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const errorStack = err instanceof Error ? err.stack : undefined;
      logWithTimestamp("Failed to save temporary file", {
        error: errorMessage,
        stack: errorStack,
      });
      // Fallback to direct stream
      logWithTimestamp("Falling back to direct stream upload");
      const fileStream = Readable.from(fileData);
      return await uploadToGoogleDrive(fileStream, file, fileData, parsedBrandId, userId);
    }

    // Initialize Google Drive authentication
    logWithTimestamp("Initializing Google Drive authentication");
    let credentials: ServiceAccountCredentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || "{}");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logWithTimestamp("Failed to parse Google Drive credentials", { error: errorMessage });
      return NextResponse.json(
        { error: "Server configuration error", details: "Failed to parse Google Drive credentials" },
        { status: 500 }
      );
    }
    if (!credentials.client_email || !credentials.private_key) {
      logWithTimestamp("Invalid Google Drive credentials");
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
    logWithTimestamp("Authorizing Google Drive client");
    try {
      await authClient.authorize();
      logWithTimestamp("Google Drive auth successful");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const errorStack = err instanceof Error ? err.stack : undefined;
      logWithTimestamp("Google Drive auth failed", {
        error: errorMessage,
        stack: errorStack,
      });
      return NextResponse.json(
        { error: "Google Drive auth failed", details: errorMessage || "Failed to authorize Google Drive client" },
        { status: 500 }
      );
    }

    // Create Drive client
    const drive = google.drive({ version: "v3", auth: authClient });

    // Upload to Google Drive
    const fileName = `${uuidv4()}-${file.name}`;
    logWithTimestamp("Starting upload to Google Drive", { fileName, fileSize: file.size });
    let response;
    try {
      response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ""],
        },
        media: {
          mimeType: file.type,
          body: fs.createReadStream(tempFilePath),
        },
        fields: "id, webViewLink",
      });
      logWithTimestamp("Upload result", response.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const errorStack = err instanceof Error ? err.stack : undefined;
      logWithTimestamp("Google Drive upload failed", {
        error: errorMessage,
        stack: errorStack,
      });
      return NextResponse.json(
        { error: "Google Drive upload failed", details: errorMessage || "Failed to upload to Google Drive" },
        { status: 500 }
      );
    }

    // Clean up temporary file
    logWithTimestamp("Cleaning up temporary file", { tempFilePath });
    await fsPromises.unlink(tempFilePath).catch((err: unknown) => {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logWithTimestamp("Failed to delete temp file", { error: errorMessage });
    });

    const videoUrl = response.data.webViewLink;
    if (!videoUrl) {
      logWithTimestamp("Invalid videoUrl", { videoUrl });
      return NextResponse.json(
        { error: "Google Drive error", details: "Failed to obtain valid video URL" },
        { status: 500 }
      );
    }

    // Save to Prisma
    logWithTimestamp("Saving reel to Prisma");
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
    logWithTimestamp("Reel saved", { reelId: reel.id });

    return NextResponse.json({ message: "Reel uploaded", reel }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    logWithTimestamp("Upload error", {
      message: errorMessage,
      stack: errorStack,
      details: JSON.stringify(err, Object.getOwnPropertyNames(err)),
      userAgent: req.headers.get("user-agent"),
      ip: req.ip,
    });
    return NextResponse.json(
      { error: "Upload failed", details: errorMessage || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

async function uploadToGoogleDrive(
  fileStream: Readable,
  file: File,
  fileData: Uint8Array,
  parsedBrandId: number,
  userId: string
) {
  const logWithTimestamp = (message: string, data: any = {}) => {
    console.log(`[${new Date().toISOString()}] ${message}`, {
      ...data,
      environment: process.env.NODE_ENV || "unknown",
    });
  };

  try {
    logWithTimestamp("Initializing Google Drive authentication (fallback)");
    let credentials: ServiceAccountCredentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || "{}");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logWithTimestamp("Failed to parse Google Drive credentials (fallback)", { error: errorMessage });
      return NextResponse.json(
        { error: "Server configuration error", details: "Failed to parse Google Drive credentials" },
        { status: 500 }
      );
    }
    if (!credentials.client_email || !credentials.private_key) {
      logWithTimestamp("Invalid Google Drive credentials (fallback)");
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

    logWithTimestamp("Authorizing Google Drive client (fallback)");
    await authClient.authorize();
    logWithTimestamp("Google Drive auth successful (fallback)");

    const drive = google.drive({ version: "v3", auth: authClient });

    const fileName = `${uuidv4()}-${file.name}`;
    logWithTimestamp("Starting direct stream upload to Google Drive", { fileName, fileSize: file.size });
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || ""],
      },
      media: {
        mimeType: file.type,
        body: fileStream,
      },
      fields: "id, webViewLink",
    });
    logWithTimestamp("Direct stream upload result", response.data);

    const videoUrl = response.data.webViewLink;
    if (!videoUrl) {
      logWithTimestamp("Invalid videoUrl (fallback)", { videoUrl });
      return NextResponse.json(
        { error: "Google Drive error", details: "Failed to obtain valid video URL" },
        { status: 500 }
      );
    }

    logWithTimestamp("Saving reel to Prisma (fallback)");
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
    logWithTimestamp("Reel saved (fallback)", { reelId: reel.id });

    return NextResponse.json({ message: "Reel uploaded", reel }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    logWithTimestamp("Direct stream upload error", {
      message: errorMessage,
      stack: errorStack,
      details: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    });
    return NextResponse.json(
      { error: "Direct stream upload failed", details: errorMessage || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}