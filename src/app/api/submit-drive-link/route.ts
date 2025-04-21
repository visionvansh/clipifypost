import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const logWithTimestamp = (message: string, data: any = {}) => {
    console.log(`[${new Date().toISOString()}] ${message}`, {
      ...data,
      environment: process.env.NODE_ENV || "unknown",
    });
  };

  logWithTimestamp("API /submit-drive-link called", {
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

    // Get request body
    logWithTimestamp("Parsing request body");
    const { brandId, driveLink } = await req.json();

    logWithTimestamp("Request parsed", { brandId, driveLink });

    if (!brandId || !driveLink) {
      logWithTimestamp("Missing brandId or driveLink", { brandId, driveLink });
      return NextResponse.json(
        { error: "Missing required fields", details: "Brand ID or Drive link not provided" },
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

    // Check for folder links
    const folderRegex = /drive\.google\.com\/drive\/folders\//;
    if (folderRegex.test(driveLink)) {
      logWithTimestamp("Folder link detected", { driveLink });
      return NextResponse.json(
        { error: "Invalid Drive link", details: "Folder links are not allowed. Please provide a direct video file link (e.g., https://drive.google.com/file/d/...)." },
        { status: 400 }
      );
    }

    // Validate Drive link format
    const driveLinkRegex = /^https:\/\/(drive\.google\.com\/(file\/d\/|open\?id=)|docs\.google\.com\/.*\/d\/)[a-zA-Z0-9_-]+(\/(view|preview|edit|embed)?)?(\?.*)?$/;
    if (!driveLinkRegex.test(driveLink)) {
      logWithTimestamp("Invalid Drive link format", { driveLink, regexTest: driveLinkRegex.test(driveLink) });
      return NextResponse.json(
        { error: "Invalid Drive link", details: "Please provide a valid Google Drive video file link (e.g., https://drive.google.com/file/d/...)." },
        { status: 400 }
      );
    }

    // Optional: Check link accessibility
    logWithTimestamp("Checking Drive link accessibility");
    try {
      const response = await fetch(driveLink, { method: "HEAD", signal: AbortSignal.timeout(5000) });
      if (!response.ok) {
        logWithTimestamp("Drive link accessibility warning", {
          status: response.status,
          statusText: response.statusText,
        });
      } else {
        logWithTimestamp("Drive link accessible");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      logWithTimestamp("Failed to check Drive link accessibility", { error: errorMessage });
    }

    // Save to Prisma
    logWithTimestamp("Saving Drive link to Prisma");
    const reel = await prisma.userReel.create({
      data: {
        studentId: userId,
        brandId: parsedBrandId,
        videoUrl: driveLink,
        storageProvider: "google_drive_link",
        fileSize: 0,
        status: "PENDING",
      },
    });
    logWithTimestamp("Reel saved", { reelId: reel.id });

    return NextResponse.json({ message: "Drive link submitted", reel }, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    const errorStack = err instanceof Error ? err.stack : undefined;
    logWithTimestamp("Submission error", {
      message: errorMessage,
      stack: errorStack,
      userAgent: req.headers.get("user-agent"),
      ip: req.ip,
    });
    return NextResponse.json(
      { error: "Submission failed", details: errorMessage || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}