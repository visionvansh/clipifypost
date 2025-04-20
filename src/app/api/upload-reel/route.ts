import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Storage } from "megajs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("API /upload-reel called", {
    userAgent: req.headers.get("user-agent"),
    ip: req.ip,
  });

  const { userId } = await auth();
  if (!userId) {
    console.log("Unauthorized access");
    return NextResponse.json(
      { error: "Unauthorized", details: "No user authenticated" },
      { status: 401 }
    );
  }

  const megaEmail = process.env.MEGA_EMAIL;
  const megaPassword = process.env.MEGA_PASSWORD;

  if (!megaEmail || !megaPassword) {
    console.log("Mega credentials missing");
    return NextResponse.json(
      { error: "Mega credentials not configured", details: "Environment variables missing" },
      { status: 500 }
    );
  }

  try {
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

    // Validate file size (max 600MB)
    if (file.size > 600 * 1024 * 1024) {
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
    const arrayBuffer = await file.arrayBuffer();
    const fileData = Buffer.from(arrayBuffer);
    console.log("File converted to Buffer:", fileData.length);

    // Verify buffer integrity
    if (fileData.length !== file.size) {
      console.log("Buffer size mismatch:", { bufferLength: fileData.length, fileSize: file.size });
      return NextResponse.json(
        { error: "Corrupted file", details: "Buffer size does not match file size" },
        { status: 400 }
      );
    }

    // Initialize Mega storage
    const mega = new Storage({
      email: megaEmail,
      password: megaPassword,
    });

    console.log("Mega login attempt");
    await new Promise<void>((resolve, reject) => {
      mega.on("ready", () => resolve());
      (mega as any).on("error", (err: Error) => reject(err));
    });
    console.log("Mega login successful");

    // Upload to Mega
    console.log("Starting upload");
    const uploadResult = await new Promise((resolve, reject) => {
      const upload = mega.upload(
        {
          name: file.name || "reel",
          size: file.size,
        },
        fileData // Pass Buffer directly
      );

      upload.on("complete", resolve);
      (upload as any).on("error", (err: Error) => reject(err));

      // Set a timeout for the upload (5 minutes)
      setTimeout(() => reject(new Error("Upload timed out")), 300000);
    });

    console.log("Upload result:", uploadResult);

    // Extract videoUrl using file.link()
    const videoUrl = await (uploadResult as any).link();
    console.log("Extracted videoUrl:", videoUrl);

    if (!videoUrl || typeof videoUrl !== "string") {
      console.error("Invalid videoUrl:", videoUrl);
      throw new Error("Failed to obtain valid video URL from Mega");
    }

    // Save to Prisma
    const reel = await prisma.userReel.create({
      data: {
        studentId: userId,
        brandId: parseInt(brandId),
        videoUrl,
        storageProvider: "mega",
        fileSize: file.size,
        status: "PENDING",
      },
    });

    console.log("Reel saved:", reel);

    return NextResponse.json({ message: "Reel uploaded", reel }, { status: 200 });
  } catch (error: any) {
    console.error("Upload error:", error.message, error.stack, {
      userAgent: req.headers.get("user-agent"),
    });
    return NextResponse.json(
      { error: "Upload failed", details: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}