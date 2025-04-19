import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ITEM_PER_PAGE } from "@/lib/settings";

type User = {
  id: string;
  username: string;
};

type Brand = {
  id: number;
  name: string;
};

type UserReelWithBrand = {
  id: number;
  videoUrl: string | null;
  status: string;
  createdAt: Date;
  brand: { name: string };
  student: { username: string };
  publishedUrl: string | null;
  views: number;
};

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ authError: true }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const selectedUserId = searchParams.get("userId") || "";
    const brandId = searchParams.get("brandId") || "";

    let users: User[] = [];
    let brands: Brand[] = [];
    let reels: UserReelWithBrand[] = [];
    let count: number = 0;

    users = await prisma.student.findMany({
      select: { id: true, username: true },
    });

    if (selectedUserId) {
      brands = await prisma.brand.findMany({
        where: {
          reels: { some: { studentId: selectedUserId } },
        },
        select: { id: true, name: true },
      });
    }

    if (selectedUserId && brandId) {
      const query = {
        studentId: selectedUserId,
        brandId: parseInt(brandId),
      };

      [reels, count] = await prisma.$transaction([
        prisma.userReel.findMany({
          where: query,
          include: {
            brand: { select: { name: true } },
            student: { select: { username: true } },
          },
          take: ITEM_PER_PAGE,
          skip: ITEM_PER_PAGE * (page - 1),
        }),
        prisma.userReel.count({ where: query }),
      ]);
    }

    return NextResponse.json({
      users,
      brands,
      reels: reels.map((reel) => ({
        ...reel,
        createdAt: reel.createdAt.toISOString(),
      })),
      count,
      authError: false,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch data", details: String(error) },
      { status: 500 }
    );
  }
}