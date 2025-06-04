import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface UserStats {
  userId: string;
  username: string;
  uploadersHub: {
    views: number;
    revenue: number;
  };
  editorsHub: {
    views: number;
    revenue: number;
  };
  total: {
    views: number;
    revenue: number;
  };
  invites: {
    count: number;
    signedUp: number;
    approved: number;
  };
  paidAmount: number;
}

interface StatsResponse {
  users: UserStats[];
  totalUploadersHubViews: number;
  totalUploadersHubRevenue: number;
  totalEditorsHubViews: number;
  totalEditorsHubRevenue: number;
  totalViews: number;
  totalRevenue: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "Month is required" }, { status: 400 });
  }

  try {
    const users = await prisma.userStatsRecord.findMany({
      where: { month },
      include: {
        student: {
          include: {
            sentInvites: {
              include: {
                invited: {
                  select: {
                    signedUpToWebsite: true,
                  },
                },
              },
            },
            payments: {
              where: { month },
            },
          },
        },
      },
    });

    const stats: StatsResponse = {
      users: users.map((record) => {
        const approvedInvites = record.student?.sentInvites?.filter((invite) => invite.status === "approved").length || 0;
        const inviteBonus = approvedInvites * 0.5;
        return {
          userId: record.userId,
          username: record.username,
          uploadersHub: {
            views: record.uploadersHubViews || 0,
            revenue: record.uploadersHubRevenue || 0,
          },
          editorsHub: {
            views: record.editorsHubViews || 0,
            revenue: record.editorsHubRevenue || 0,
          },
          total: {
            views: record.totalViews || 0,
            revenue: (record.totalRevenue || 0) + inviteBonus,
          },
          invites: {
            count: record.student?.sentInvites?.length || 0,
            signedUp: record.student?.sentInvites?.filter((invite) => invite.invited?.signedUpToWebsite).length || 0,
            approved: approvedInvites,
          },
          paidAmount: record.student?.payments?.reduce((sum: number, payment: { amount: number }) => sum + (payment.amount || 0), 0) || 0,
        };
      }),
      totalUploadersHubViews: users.reduce((sum, record) => sum + (record.uploadersHubViews || 0), 0),
      totalUploadersHubRevenue: users.reduce((sum, record) => sum + (record.uploadersHubRevenue || 0), 0),
      totalEditorsHubViews: users.reduce((sum, record) => sum + (record.editorsHubViews || 0), 0),
      totalEditorsHubRevenue: users.reduce((sum, record) => sum + (record.editorsHubRevenue || 0), 0),
      totalViews: users.reduce((sum, record) => sum + (record.totalViews || 0), 0),
      totalRevenue: users.reduce((sum, record) => sum + (record.totalRevenue || 0), 0),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}