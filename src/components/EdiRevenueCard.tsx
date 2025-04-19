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
    },
  });

  return <RevenueChartClient type={type} reels={reels} />;
};

export default RevenueChart;