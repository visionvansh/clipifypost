import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/server-actions";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("imageFile") as File;
    const imageUrl = await uploadImage(imageFile);
    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Image upload failed" }, { status: 500 });
  }
}