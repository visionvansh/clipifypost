import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import RevenueChartClient from "./UpRevenueClient";

const RevenueChart = async ({ type }: { type: "Your Revenue" }) => {
  const { userId } = await auth();

  if (!userId) {
    return <div className="text-gray-400 p-4">Please log in to view your stats.</div>;
  }

  // Fetch clips with their company rates for the last 12 months for the current user
  const clips = await prisma.clip.findMany({
    where: {
      account: {
        userId: userId,
      },
      status: "approved",
      postedAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
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
  });

  return <RevenueChartClient type={type} clips={clips} />;
};

export default RevenueChart;