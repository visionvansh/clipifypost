import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import ViewsChartClient from "./ViewsChartClient";

const ViewsChart = async ({ type }: { type: "Your Views" }) => {
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
    },
  });

  return <ViewsChartClient type={type} reels={reels} />;
};

export default ViewsChart;