"use server";

import cloudinary from "@/lib/cloudinary";
import { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

export async function uploadImage(imageFile: File): Promise<string> {
  if (!imageFile) {
    throw new Error("No image file provided!");
  }

  // Validate file size (max 5MB)
  if (imageFile.size > 5 * 1024 * 1024) {
    throw new Error("File size too large! Max 5MB allowed.");
  }

  // Validate file type
  if (!["image/jpeg", "image/png", "image/gif"].includes(imageFile.type)) {
    throw new Error("Please select an image file (JPEG, PNG, GIF)!");
  }

  const bytes = await imageFile.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "image", public_id: `${Date.now()}-${imageFile.name}` },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) reject(error);
          else resolve(result!);
        }
      )
      .end(buffer);
  });

  return uploadResult.secure_url;
}