"use server";

import  prisma  from "@/lib/prisma";

export async function verifyAccount(accountId: number, isVerified: boolean) {
  return prisma.account.update({
    where: { id: accountId },
    data: { isVerified, status: isVerified ? "Verified" : "Declined" },
  });
}

export async function updateClipStatus(clipId: number, status: "approved" | "rejected") {
  return prisma.clip.update({
    where: { id: clipId },
    data: { status },
  });
}