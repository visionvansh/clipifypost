import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface UserStats {
  userId: string;
  username: string;
  views: number;
  revenue: number;
}

interface StatsResponse {
  users: UserStats[];
  totalViews: number;
  totalRevenue: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // month format: "2025-04" (YYYY-MM)

  if (!month) {
    console.error("Invalid month parameter:", month);
    return NextResponse.json({ error: "Month is required in YYYY-MM format." }, { status: 400 });
  }

  try {
    console.log("Fetching uploaders stats for month:", month);
    // Fetch all students with their reels for the given month (based on upload date)
    const students = await prisma.student.findMany({
      select: {
        id: true,
        username: true,
        userReel: {
          where: {
            createdAt: {
              gte: new Date(`${month}-01T00:00:00.000Z`),
              lt: new Date(
                new Date(`${month}-01T00:00:00.000Z`).setMonth(
                  new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1
                )
              ),
            },
          },
          select: {
            id: true,
            views: true,
            brand: {
              select: {
                rate: true, // Dollars per 100k views
              },
            },
            reel: {
              select: {
                status: true,
                views: true,
                createdAt: true,
              },
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    console.log("Students fetched for uploaders-stats:", students);

    // Process data: Calculate views and revenue per user
    const userStats: UserStats[] = students.map((student) => {
      let totalViews = 0;
      let totalRevenue = 0;

      student.userReel.forEach((reel) => {
        let currentViews = 0;
        let lastStatus: string | null = null;

        // Process status history to calculate net views
        reel.reel.forEach((history) => {
          if (history.status === "APPROVED" && lastStatus !== "APPROVED") {
            currentViews += history.views; // Add views on approval
          } else if (history.status === "DISAPPROVED" && lastStatus === "APPROVED") {
            currentViews -= history.views; // Subtract views on disapproval
          }
          lastStatus = history.status;
        });

        // If the reel is currently approved, use its current views if higher
        if (lastStatus === "APPROVED" && reel.views > currentViews) {
          currentViews = reel.views;
        }

        totalViews += currentViews;

        // Calculate revenue: rate is dollars per 100k views
        const rate = reel.brand?.rate || 0;
        const revenue = (currentViews / 100000) * rate;
        totalRevenue += revenue;
      });

      return {
        userId: student.id,
        username: student.username,
        views: totalViews,
        revenue: totalRevenue,
      };
    });

    console.log("User stats calculated for uploaders-stats:", userStats);

    // Calculate total views and revenue across all users
    const totalViews = userStats.reduce((sum, user) => sum + user.views, 0);
    const totalRevenue = userStats.reduce((sum, user) => sum + user.revenue, 0);

    return NextResponse.json({
      users: userStats,
      totalViews,
      totalRevenue,
    });
  } catch (error: any) {
    console.error("Error in uploaders-stats API:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch uploaders stats." }, { status: 500 });
  }
}