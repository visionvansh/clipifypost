import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import LifetimeViewsCardClient from "./LifetimeViewsCardClient";

const LifetimeViewsCard = async ({ type }: { type: "Lifetime Views" }) => {
  const { userId } = await auth();
  if (!userId) return <div>Please log in</div>;

  const reels = await prisma.userReel.findMany({
    where: {
      studentId: userId,
    },
    select: {
      views: true,
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

  // Calculate total views only for APPROVED reels
  const totalViews = reels.reduce((acc, reel) => {
    const latestStatus = reel.reel.length > 0 ? reel.reel[reel.reel.length - 1].status : null;
    if (latestStatus === "APPROVED") {
      return acc + (reel.views || 0);
    }
    return acc; // If PENDING or DISAPPROVED, don't add views
  }, 0);

  return <LifetimeViewsCardClient type={type} totalViews={totalViews} />;
};

export default LifetimeViewsCard;