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

// Type for the attendance object returned by Prisma with only views selected
interface AttendanceViews {
  views: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // month format: "2025-04" (YYYY-MM)

  if (!month) {
    console.error("Invalid month parameter:", month);
    return NextResponse.json({ error: "Month is required in YYYY-MM format." }, { status: 400 });
  }

  try {
    console.log("Fetching editors stats for month:", month);
    // Fetch all students with their attendance and result records
    const students = await prisma.student.findMany({
      select: {
        id: true,
        username: true,
        attendence: {
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
            views: true,
          },
        },
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
        result: {
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
            revenue: true,
          },
        },
      },
    });

    console.log("Students fetched for editors-stats:", students);

    // Process data: Calculate views and revenue per user
    const userStats: UserStats[] = students.map((student) => {
      // Calculate views from Attendance
      const totalAttendanceViews = student.attendence.reduce((sum: number, attendence: AttendanceViews) => {
        const views = parseInt(attendence.views || "0", 10);
        return sum + (isNaN(views) ? 0 : views);
      }, 0);

      // Calculate views from UserReel with approval/disapproval logic
      let totalReelViews = 0;
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

        totalReelViews += currentViews;
      });

      // Total views for Editors Hub: Combine Attendance views and Reel views
      const totalViews = totalAttendanceViews + totalReelViews;

      // Calculate revenue from Result
      const totalRevenue = student.result.reduce((sum: number, result: { revenue: string }) => {
        const revenue = parseFloat(result.revenue || "0");
        return sum + (isNaN(revenue) ? 0 : revenue);
      }, 0);

      return {
        userId: student.id,
        username: student.username,
        views: totalViews,
        revenue: totalRevenue,
      };
    });

    console.log("User stats calculated for editors-stats:", userStats);

    // Calculate total views and revenue across all users
    const totalViews = userStats.reduce((sum: number, user: UserStats) => sum + user.views, 0);
    const totalRevenue = userStats.reduce((sum: number, user: UserStats) => sum + user.revenue, 0);

    return NextResponse.json({
      users: userStats,
      totalViews,
      totalRevenue,
    });
  } catch (error: any) {
    console.error("Error in editors-stats API:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch editors stats." }, { status: 500 });
  }
}