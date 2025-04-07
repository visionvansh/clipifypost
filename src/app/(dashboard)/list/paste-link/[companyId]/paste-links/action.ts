"use server";

import prisma from "@/lib/prisma";

export async function handleClipSubmit(formData: FormData): Promise<{ success?: string; error?: string }> {
  const accountId = parseInt(formData.get("accountId") as string);
  const link = formData.get("link") as string;
  const views = parseInt(formData.get("views") as string);
  const companyId = parseInt(formData.get("companyId") as string);

  // Check for duplicate link
  const existingClip = await prisma.clip.findFirst({ where: { link, companyId } });
  if (existingClip) {
    return { error: "Duplicate link detected! Please use a unique link." };
  }

  await prisma.clip.create({
    data: { accountId, companyId, link, views, status: "pending" },
  });

  return { success: "Clip submitted successfully!" };
}

export async function handleUpdateViews(formData: FormData): Promise<{ success?: string; error?: string }> {
  const clipId = parseInt(formData.get("clipId") as string);
  const views = parseInt(formData.get("views") as string);

  await prisma.clip.update({ where: { id: clipId }, data: { views } });

  return { success: "Views updated successfully!" };
}