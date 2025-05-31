import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import LifetimeRevenueCardClient from "./LifetimeRevenueCardClient";

const LifetimeRevenueCard = async ({ type }: { type: "Lifetime Revenue" }) => {
  const { userId } = await auth();
  if (!userId) return <div>Please log in</div>;

  const reels = await prisma.userReel.findMany({
    where: {
      studentId: userId,
    },
    select: {
      views: true,
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

  // Calculate total revenue only for APPROVED reels
  const totalRevenue = reels.reduce((acc, reel) => {
    const latestStatus = reel.reel.length > 0 ? reel.reel[reel.reel.length - 1].status : null;
    if (latestStatus === "APPROVED") {
      const viewsValue = reel.views || 0;
      const rate = reel.brand?.rate || 0;
      return acc + (viewsValue / 100000) * rate;
    }
    return acc; // If PENDING or DISAPPROVED, don't add revenue
  }, 0);

  return <LifetimeRevenueCardClient type={type} totalRevenue={totalRevenue} />;
};

export default LifetimeRevenueCard;