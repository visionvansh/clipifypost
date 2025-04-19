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
    },
  });

  const totalRevenue = reels.reduce((acc, reel) => {
    const viewsValue = reel.views || 0;
    const rate = reel.brand.rate || 0;
    return acc + (viewsValue / 100000) * rate;
  }, 0);

  return <LifetimeRevenueCardClient type={type} totalRevenue={totalRevenue} />;
};

export default LifetimeRevenueCard;