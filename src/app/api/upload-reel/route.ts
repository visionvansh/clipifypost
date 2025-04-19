import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Storage } from "megajs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("API /upload-reel called");

  const { userId } = await auth();
  if (!userId) {
    console.log("Unauthorized access");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const megaEmail = process.env.MEGA_EMAIL;
  const megaPassword = process.env.MEGA_PASSWORD;

  if (!megaEmail || !megaPassword) {
    console.log("Mega credentials missing");
    return NextResponse.json(
      { error: "Mega credentials not configured" },
      { status: 500 }
    );
  }

  try {
    // Get form data
    const formData = await req.formData();
    const brandId = formData.get("brandId") as string;
    const file = formData.get("reel") as File;

    console.log("Form parsed:", { brandId, fileName: file?.name });

    if (!brandId || !file) {
      console.log("Missing brandId or file:", { brandId, file });
      return NextResponse.json(
        { error: "Brand ID or file missing" },
        { status: 400 }
      );
    }

    if (file.size > 600 * 1024 * 1024) {
      console.log("File too large:", file.size);
      return NextResponse.json(
        { error: "File too large (max 600MB)" },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileData = Buffer.from(arrayBuffer);
    console.log("File converted to Buffer:", fileData.length);

    // Mega upload
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

    console.log("Starting upload");
    const uploadResult = await new Promise((resolve, reject) => {
      const upload = mega.upload(
        {
          name: file.name || "reel",
          size: file.size,
        },
        fileData // Direct Buffer data
      );

      upload.on("complete", resolve);
      (upload as any).on("error", (err: Error) => reject(err));
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
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: String(error) },
      { status: 500 }
    );
  }
}