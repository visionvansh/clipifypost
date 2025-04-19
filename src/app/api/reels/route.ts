import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ITEM_PER_PAGE } from "@/lib/settings";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";

    const query: Prisma.UserReelWhereInput = { studentId: userId };

    if (search) {
      query.videoUrl = { contains: search, mode: "insensitive" };
    }

    const [reels, count, brands] = await prisma.$transaction([
      prisma.userReel.findMany({
        where: query,
        include: { brand: { select: { name: true } } },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (page - 1),
      }),
      prisma.userReel.count({ where: query }),
      prisma.brand.findMany({ select: { id: true, name: true } }),
    ]);

    return NextResponse.json({
      reels,
      count,
      brands,
      page,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: String(error) },
      { status: 500 }
    );
  }
}