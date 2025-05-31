import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import MonthlyRevenueChartClient from "./EdiRevenueChartClient";

const MonthlyRevenueChart = async ({ type }: { type: "Monthly Revenue" }) => {
  const { userId } = await auth();
  if (!userId) return <div>Please log in</div>;

  // Fetch all reels for the user with status history
  const reels = await prisma.userReel.findMany({
    where: {
      studentId: userId,
    },
    select: {
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
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc", // To get the status history in chronological order
        },
      },
    },
  });

  // Group revenue by year and month, only for APPROVED reels
  const yearlyData: { [year: string]: { [month: string]: number } } = {};
  reels.forEach((reel) => {
    // Check the latest status of the reel
    const latestStatus = reel.reel.length > 0 ? reel.reel[reel.reel.length - 1].status : null;
    if (latestStatus !== "APPROVED") return; // Skip if not APPROVED

    const date = new Date(reel.createdAt);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString("default", { month: "short" });
    const viewsValue = reel.views || 0;
    const rate = reel.brand?.rate || 0;
    const revenue = (viewsValue / 100000) * rate;
    if (!yearlyData[year]) yearlyData[year] = {};
    yearlyData[year][month] = (yearlyData[year][month] || 0) + revenue;
  });

  // Get available years
  const availableYears = Object.keys(yearlyData)
    .map((year) => parseInt(year))
    .sort((a, b) => b - a);

  return <MonthlyRevenueChartClient type={type} yearlyData={yearlyData} availableYears={availableYears} />;
};

export default MonthlyRevenueChart;