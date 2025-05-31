import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

// Utility function to get month name and year (e.g., "January 2025")
const getMonthName = (date: Date) => {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

interface UserStats {
  userId: string;
  username: string;
  uploadersHub: {
    views: number;
    revenue: number;
  };
  editorsHub: {
    views: number;
    revenue: number;
  };
  total: {
    views: number;
    revenue: number;
  };
}

interface StatsResponse {
  users: UserStats[];
  totalUploadersHubViews: number;
  totalUploadersHubRevenue: number;
  totalEditorsHubViews: number;
  totalEditorsHubRevenue: number;
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
    console.log("Fetching user stats for month:", month);

    // Fetch all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        username: true,
        accounts: {
          select: {
            clips: {
              where: {
                status: "approved",
                postedAt: {
                  gte: new Date(`${month}-01T00:00:00.000Z`),
                  lt: new Date(
                    new Date(`${month}-01T00:00:00.000Z`).setMonth(
                      new Date(`${month}-01T00:00:00.000Z`).getMonth() + 1
                    )
                  ),
                  not: null,
                },
              },
              select: {
                views: true,
                postedAt: true,
                company: {
                  select: {
                    rate: true,
                  },
                },
              },
            },
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
            createdAt: true,
            brand: {
              select: {
                rate: true,
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

    console.log("Students fetched for user-stats:", students);

    // Map Clerk userId to Student IDs
    const clerkUserMap: { [key: string]: { clerkUserId: string; clerkUsername: string } } = {};
    for (const student of students) {
      // Assuming student.id is the Clerk userId (as per your setup)
      const clerkUser = await currentUser();
      if (clerkUser && clerkUser.id === student.id) {
        clerkUserMap[student.id] = {
          clerkUserId: clerkUser.id,
          clerkUsername: clerkUser.username || clerkUser.firstName || "Unknown",
        };
      } else {
        // If no Clerk user matches, use default values
        clerkUserMap[student.id] = {
          clerkUserId: student.id,
          clerkUsername: student.username,
        };
      }
    }

    // Process data: Calculate views and revenue per user
    const userStats: UserStats[] = students.map((student) => {
      // Uploaders Hub: Calculate views and revenue from Clips
      let uploadersViews = 0;
      let uploadersRevenue = 0;

      const selectedMonthName = getMonthName(new Date(`${month}-01T00:00:00.000Z`));

      student.accounts.forEach((account) => {
        account.clips.forEach((clip) => {
          if (!clip.postedAt) return;
          const clipDate = new Date(clip.postedAt);
          const clipMonth = getMonthName(clipDate);
          if (clipMonth !== selectedMonthName) return;

          const viewsValue = clip.views && !isNaN(Number(clip.views)) ? Number(clip.views) : 0;
          uploadersViews += viewsValue;

          const rate = clip.company?.rate && !isNaN(Number(clip.company.rate)) ? Number(clip.company.rate) : 0;
          const revenue = (viewsValue / 100000) * rate;
          uploadersRevenue += revenue;
        });
      });

      // Editors Hub: Calculate views and revenue from UserReel (only approved reels)
      let editorsViews = 0;
      let editorsRevenue = 0;

      student.userReel.forEach((reel) => {
        const reelDate = new Date(reel.createdAt);
        const reelMonth = reelDate.toISOString().slice(0, 7);
        if (reelMonth !== month) return;

        // Check if the reel is approved
        let lastStatus: string | null = null;
        reel.reel.forEach((history) => {
          lastStatus = history.status;
        });

        if (lastStatus !== "APPROVED") return;

        const viewsValue = reel.views || 0;
        editorsViews += viewsValue;

        const rate = reel.brand?.rate || 0;
        const revenue = (viewsValue / 100000) * rate;
        editorsRevenue += revenue;
      });

      // Total for this user
      const totalViews = uploadersViews + editorsViews;
      const totalRevenue = uploadersRevenue + editorsRevenue;

      return {
        userId: student.id,
        username: student.username,
        uploadersHub: {
          views: uploadersViews,
          revenue: uploadersRevenue,
        },
        editorsHub: {
          views: editorsViews,
          revenue: editorsRevenue,
        },
        total: {
          views: totalViews,
          revenue: totalRevenue,
        },
      };
    });

    console.log("User stats calculated:", userStats);

    // Store or update the stats in the UserStatsRecord table
    for (const user of userStats) {
      const clerkData = clerkUserMap[user.userId] || {
        clerkUserId: user.userId,
        clerkUsername: user.username,
      };

      await prisma.userStatsRecord.upsert({
        where: {
          userId_month: { // Composite key
            userId: user.userId,
            month: month,
          },
        },
        update: {
          username: user.username,
          clerkUserId: clerkData.clerkUserId,
          clerkUsername: clerkData.clerkUsername,
          uploadersHubViews: user.uploadersHub.views,
          uploadersHubRevenue: user.uploadersHub.revenue,
          editorsHubViews: user.editorsHub.views,
          editorsHubRevenue: user.editorsHub.revenue,
          totalViews: user.total.views,
          totalRevenue: user.total.revenue,
          updatedAt: new Date(),
        },
        create: {
          userId: user.userId,
          username: user.username,
          clerkUserId: clerkData.clerkUserId,
          clerkUsername: clerkData.clerkUsername,
          month: month,
          uploadersHubViews: user.uploadersHub.views,
          uploadersHubRevenue: user.uploadersHub.revenue,
          editorsHubViews: user.editorsHub.views,
          editorsHubRevenue: user.editorsHub.revenue,
          totalViews: user.total.views,
          totalRevenue: user.total.revenue,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    console.log("User stats stored/updated in UserStatsRecord table");

    // Calculate totals across all users
    const totalUploadersHubViews = userStats.reduce((sum, user) => sum + user.uploadersHub.views, 0);
    const totalUploadersHubRevenue = userStats.reduce((sum, user) => sum + user.uploadersHub.revenue, 0);
    const totalEditorsHubViews = userStats.reduce((sum, user) => sum + user.editorsHub.views, 0);
    const totalEditorsHubRevenue = userStats.reduce((sum, user) => sum + user.editorsHub.revenue, 0);
    const totalViews = userStats.reduce((sum, user) => sum + user.total.views, 0);
    const totalRevenue = userStats.reduce((sum, user) => sum + user.total.revenue, 0);

    return NextResponse.json({
      users: userStats,
      totalUploadersHubViews,
      totalUploadersHubRevenue,
      totalEditorsHubViews,
      totalEditorsHubRevenue,
      totalViews,
      totalRevenue,
    });
  } catch (error: any) {
    console.error("Error in user-stats API:", error.message, error.stack);
    return NextResponse.json({ error: "Failed to fetch user stats." }, { status: 500 });
  }
}