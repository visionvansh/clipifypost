import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkViewsAndApprove() {
  const invites = await prisma.invite.findMany({
    where: { status: 'pending' },
    include: { invited: { include: { stats: true } } },
  });

  for (const invite of invites) {
    const totalViews = invite.invited.stats.reduce((sum: number, stat: any) => sum + stat.totalViews, 0);
    if (totalViews >= 10000) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'approved', invitedViews: totalViews },
      });
      await prisma.referralEarning.create({
        data: {
          studentId: invite.inviterId,
          invitedId: invite.invitedId,
          amount: 0.5,
          month: new Date().toISOString().slice(0, 7),
        },
      });
    }
  }
}