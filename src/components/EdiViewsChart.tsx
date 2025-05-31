import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import MonthlyViewsChartClient from "./EdiViewsChartClient";

const MonthlyViewsChart = async ({ type }: { type: "Monthly Views" }) => {
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

  // Group views by year and month, only for APPROVED reels
  const yearlyData: { [year: string]: { [month: string]: number } } = {};
  reels.forEach((reel) => {
    // Check the latest status of the reel
    const latestStatus = reel.reel.length > 0 ? reel.reel[reel.reel.length - 1].status : null;
    if (latestStatus !== "APPROVED") return; // Skip if not APPROVED

    const date = new Date(reel.createdAt);
    const year = date.getFullYear().toString();
    const month = date.toLocaleString("default", { month: "short" });
    if (!yearlyData[year]) yearlyData[year] = {};
    yearlyData[year][month] = (yearlyData[year][month] || 0) + (reel.views || 0);
  });

  // Get available years
  const availableYears = Object.keys(yearlyData)
    .map((year) => parseInt(year))
    .sort((a, b) => b - a);

  return <MonthlyViewsChartClient type={type} yearlyData={yearlyData} availableYears={availableYears} />;
};

export default MonthlyViewsChart;