import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const invites = await prisma.invite.findMany({
      where: {
        inviterId: userId,
      },
      include: {
        invited: {
          select: {
            signedUpToWebsite: true,
            discordUsername: true,
          },
        },
      },
    });

    const inviteDetails = invites.map((invite) => ({
      inviteId: invite.id.toString(),
      discordUsername: invite.invited.discordUsername || invite.invitedUsername || null,
      signedUpToWebsite: invite.invited.signedUpToWebsite,
      status: invite.status,
    }));

    const approvedCount = inviteDetails.filter(
      (invite) => invite.status === "approved" && invite.signedUpToWebsite
    ).length;
    const totalPayout = approvedCount * 0.5;

    // Calculate total paid out from ReferralEarning for all time
    const paidOut = await prisma.referralEarning.aggregate({
      where: { studentId: userId },
      _sum: { amount: true },
    });
    const totalPaidOut = paidOut._sum.amount || 0;

    console.log("Invite API response:", { inviteDetails, approvedCount, totalPayout, totalPaidOut });
    return NextResponse.json({ inviteDetails, approvedCount, totalPayout, totalPaidOut });
  } catch (error) {
    console.error("Error fetching invite details:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}