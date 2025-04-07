// src/app/api/clips/route.ts
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { userId } = await auth();
  const { searchParams } = new URL(request.url);
  const companyId = parseInt(searchParams.get("companyId") || "0");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.student.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const clips = await prisma.clip.findMany({
    where: {
      companyId,
      accountId: { in: user.accounts.map((acc) => acc.id) },
    },
  });

  return NextResponse.json(clips);
}