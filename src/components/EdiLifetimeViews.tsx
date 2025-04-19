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
    },
  });

  const totalViews = reels.reduce((acc, reel) => acc + (reel.views || 0), 0);

  return <LifetimeViewsCardClient type={type} totalViews={totalViews} />;
};

export default LifetimeViewsCard;