import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import ViewsChartClient from "./UpViewsChartClient";

const ViewsChart = async ({ type }: { type: "Your View" }) => {
  const { userId } = await auth();

  if (!userId) {
    return <div className="text-gray-400 p-4">Please log in to view your stats.</div>;
  }

  // Fetch clips for the last 12 months for the current user
  const clips = await prisma.clip.findMany({
    where: {
      account: {
        userId: userId, // Match clips via Account table for the current user
      },
      status: "approved", // Only count approved clips
      postedAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 12)), // Last 12 months
        not: null, // Ensure postedAt is not null
      },
    },
    select: {
      views: true,
      postedAt: true,
    },
  });

  return <ViewsChartClient type={type} clips={clips} />;
};

export default ViewsChart;