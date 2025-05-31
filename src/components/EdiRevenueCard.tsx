import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import RevenueChartClient from "./RevenueChartClient";

const RevenueChart = async ({ type }: { type: "Your Revenue" }) => {
  const { userId } = await auth();
  if (!userId) return <div>Please log in</div>;

  const reels = await prisma.userReel.findMany({
    where: {
      studentId: userId,
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
      },
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
          views: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc", // To get the status history in chronological order
        },
      },
    },
  });

  return <RevenueChartClient type={type} reels={reels} />;
};

export default RevenueChart;