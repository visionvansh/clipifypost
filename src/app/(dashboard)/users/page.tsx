import React, { Suspense } from "react";
import RevenueChart from "@/components/RevenueChart";
import ViewsChart from "@/components/ViewsChart";
import { MdCloudUpload, MdEdit, MdOutlinePeople } from "react-icons/md";
import RevFetch from "@/components/VewChart";
import RevChart from "@/components/RevChart";
import EdiRevenue from "@/components/EdiRevenueCard";
import EdiViews from "@/components/EdiViewsCard";
import LifetimeRevenueCard from "@/components/LifetimeRevenue";
import LifetimeViews from "@/components/lifetimeViews";
import EdiLifetimeViews from "@/components/EdiLifetimeViews";
import EdiLifetimeRevenue from "@/components/EdiLifetimeRevenue";
import EdiViewsChart from "@/components/EdiViewsChart";
import EdiRevenueChart from "@/components/EdiRevenueChart";
import InvitedToServerCard from "@/components/InvitedToServerCard";
import LoggedInWebsiteCard from "@/components/LoggedInWebsiteCard";
import PendingUsersCard from "@/components/PendingUsersCard";
import ApprovedReferredCard from "@/components/ApprovedReferredCard";
import TotalEarningsCard from "@/components/TotalEarningsCard";
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { DashboardData } from '@/types/dashboard';
import { redirect } from "next/navigation";
import PageLoader from "@/components/PageLoader";

export default async function Users({ searchParams }: { searchParams: Promise<{ [keys: string]: string | undefined }> }) {
  const resolvedSearchParams = await searchParams;

  const { userId: authUserId, getToken } = await auth();

  // Redirect to sign-in if not authenticated
  if (!authUserId) {
    console.log('No authenticated user, redirecting to /');
    redirect('/');
  }

  // Double-check auth state
  const session = await auth();
  if (!session?.userId) {
    console.error('Session invalid after redirect check, redirecting to /');
    redirect('/');
  }

  let dashboardData: DashboardData = {
    discordUsername: 'N/A',
    inviteLink: undefined,
    inviteCount: 0,
    loggedInWebsite: 0,
    pendingUsers: [],
    approvedUsers: [],
    earnings: 0,
  };

  try {
    const student = await prisma.student.findUnique({
      where: { id: authUserId },
      include: {
        inviteStats: true,
        sentInvites: {
          include: {
            invited: {
              select: {
                id: true,
                username: true,
                discordUsername: true,
                discordId: true,
                signedUpToWebsite: true,
              },
            },
          },
        },
        inviteLinks: true,
      },
    });

    if (student) {
      const inviteCount = student.inviteStats?.inviteCount || 0;
      const loggedInWebsite = await prisma.student.count({
        where: {
          id: {
            in: (await prisma.invite.findMany({ where: { inviterId: authUserId }, select: { invitedId: true } })).map(
              (i) => i.invitedId
            ),
          },
          signedUpToWebsite: true,
        },
      });

      const allInvites = await prisma.invite.findMany({
        where: { inviterId: authUserId },
        select: { id: true, invitedId: true, invitedUsername: true, status: true },
      });

      const invitedStudents = await prisma.student.findMany({
        where: { id: { in: allInvites.map((i) => i.invitedId) } },
        select: {
          id: true,
          username: true,
          discordUsername: true,
          discordId: true,
          signedUpToWebsite: true,
        },
      });

      const pendingUsers = [];
      for (const invite of allInvites) {
        const invitedStudent = invitedStudents.find((s) => s.id === invite.invitedId);
        if (!invitedStudent) continue;

        const totalViews = await prisma.userStatsRecord.aggregate({
          where: { clerkUserId: invitedStudent.id },
          _sum: { totalViews: true },
        });
        const views = totalViews._sum.totalViews ?? 0;

        const newStatus = views >= 10000 ? 'approved' : 'pending';
        if (invite.status !== newStatus) {
          await prisma.$transaction(async (tx) => {
            await tx.invite.update({
              where: { id: invite.id },
              data: {
                invitedUsername: invitedStudent?.username || invite.invitedUsername,
                status: newStatus,
              },
            });
          });
        }

        if (newStatus === 'pending') {
          pendingUsers.push({
            username: invitedStudent?.username || 'Unknown',
            discordUsername: invitedStudent?.discordUsername || invite.invitedUsername || 'N/A',
            discordId: invitedStudent?.discordId || 'N/A',
            totalViews: views,
            isApproved: views >= 10000,
            signedUpToWebsite: invitedStudent?.signedUpToWebsite || false,
          });
        }
      }

      let pendingUsersData: { pendingUsers: any[]; approvedUsers: number } = { pendingUsers, approvedUsers: 0 };
      try {
        const token = await getToken({ template: 'clerk' });
        if (token) {
          const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/invites/pending`;
          const pendingResponse = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          });
          if (pendingResponse.ok) {
            pendingUsersData = await pendingResponse.json();
          } else {
            const errorText = await pendingResponse.text();
            console.error(`Pending users fetch failed: ${pendingResponse.status} ${pendingResponse.statusText}`, errorText);
            pendingUsersData.pendingUsers = pendingUsers;
            pendingUsersData.approvedUsers = await prisma.invite.count({
              where: { inviterId: authUserId, status: 'approved' },
            });
          }
        } else {
          console.error('No Clerk token received');
          pendingUsersData.pendingUsers = pendingUsers;
          pendingUsersData.approvedUsers = await prisma.invite.count({
            where: { inviterId: authUserId, status: 'approved' },
          });
        }
      } catch (error) {
        console.error('Error fetching pending users:', error);
        pendingUsersData.pendingUsers = pendingUsers;
        pendingUsersData.approvedUsers = await prisma.invite.count({
          where: { inviterId: authUserId, status: 'approved' },
        });
      }

      const approvedUsers = await prisma.invite.findMany({
        where: { inviterId: authUserId, status: 'approved' },
        include: {
          invited: {
            select: { username: true, discordUsername: true, discordId: true },
          },
        },
      });

      const approvedUsersCount = pendingUsersData.approvedUsers;
      const earnings = approvedUsersCount * 0.5;

      dashboardData = {
        discordUsername: student.discordUsername || 'N/A',
        inviteLink: student.inviteLinks[0]?.inviteLink,
        inviteCount,
        loggedInWebsite,
        pendingUsers: pendingUsersData.pendingUsers.map((p: any) => ({
          username: p.username || 'Unknown',
          discordUsername: p.discordUsername || 'N/A',
          discordId: p.discordId || 'N/A',
          totalViews: p.totalViews || 0,
          isApproved: p.isApproved || false,
          signedUpToWebsite: p.signedUpToWebsite || false,
        })),
        approvedUsers: approvedUsers.map((a) => ({
          clerkUsername: a.invited?.username || a.invitedUsername || 'Unknown',
          discordUsername: a.invited?.discordUsername || a.invitedUsername || 'N/A',
          discordId: a.invited?.discordId || 'N/A',
        })),
        earnings,
      };
    }
  } catch (error) {
    console.error('Error fetching invite data:', error);
  }

  return (
    <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center" />}>
      <PageLoader>
        <div className="bg-gradient-to-b from-black to-gray-900 min-h-screen w-full flex flex-col p-6 md:p-8 text-white overflow-y-auto">
          <div className="flex items-center space-x-3 md:space-x-4">
            <img
              src="/yellowlogo.png"
              alt="Logo"
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover animate-logo-glow"
            />
            <h1
              className="text-3xl md:text-5xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight"
              style={{ textShadow: "0 0 10px rgba(234, 179, 8, 0.8)" }}
            >
              DASHBOARD
            </h1>
          </div>

          <div className="flex items-center space-x-2 mt-6 md:mt-8 mb-4 md:mb-6">
            <MdCloudUpload className="w-6 h-6 text-yellow-500 glowing-icon twinkling-icon" />
            <h2 className="text-xl md:text-2xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow">
              UPLOADERS OVERVIEW
            </h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4 md:mb-6"></div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <ViewsChart type="Your View" />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <RevenueChart type="Your Revenue" />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <LifetimeViews />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <LifetimeRevenueCard />
            </Suspense>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full mt-6 md:mt-8">
            <Suspense fallback={<div className="bg-gray-800 h-64 rounded-lg" />}>
              <RevFetch />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-64 rounded-lg" />}>
              <RevChart />
            </Suspense>
          </div>

          <div className="flex items-center space-x-2 mt-6 md:mt-8 mb-4 md:mb-6">
            <MdEdit className="w-6 h-6 text-yellow-500 glowing-icon twinkling-icon" />
            <h2 className="text-xl md:text-2xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow">
              EDITORS OVERVIEW
            </h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4 md:mb-6"></div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full">
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <EdiViews type="Your Views" />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <EdiRevenue type="Your Revenue" />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <EdiLifetimeViews type="Lifetime Views" />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <EdiLifetimeRevenue type="Lifetime Revenue" />
            </Suspense>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full mt-6 md:mt-8">
            <Suspense fallback={<div className="bg-gray-800 h-64 rounded-lg" />}>
              <EdiViewsChart type="Monthly Views" />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-64 rounded-lg" />}>
              <EdiRevenueChart type="Monthly Revenue" />
            </Suspense>
          </div>

          <div className="flex items-center space-x-2 mt-6 md:mt-8 mb-4 md:mb-6">
            <MdOutlinePeople className="w-6 h-6 text-yellow-500 glowing-icon twinkling-icon" />
            <h2 className="text-xl md:text-2xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow">
              REFERRAL OVERVIEW
            </h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4 md:mb-6"></div>

          {dashboardData.inviteLink && (
            <div className="mt-4 bg-gray-800 p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-white font-poppins">Your Invite Link</h3>
              <p className="text-sm text-gray-300 font-medium break-all">{dashboardData.inviteLink}</p>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full mt-4 md:mt-6">
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <InvitedToServerCard inviteCount={dashboardData.inviteCount} />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <LoggedInWebsiteCard loggedInWebsite={dashboardData.loggedInWebsite} />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <ApprovedReferredCard approvedUsers={dashboardData.approvedUsers.length} />
            </Suspense>
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <TotalEarningsCard earnings={dashboardData.earnings} />
            </Suspense>
          </div>

          <div className="w-full mt-4 md:mt-6">
            <Suspense fallback={<div className="bg-gray-800 h-32 rounded-lg" />}>
              <PendingUsersCard pendingUsers={dashboardData.pendingUsers} />
            </Suspense>
          </div>

          <script
            dangerouslySetInnerHTML={{
              __html: `
                setInterval(async () => {
                  const token = await fetch('/api/auth/session').then(res => res.json()).then(data => data.token);
                  if (!token) return;
                  const response = await fetch('/api/invites/refresh', {
                    headers: {
                      Authorization: \`Bearer \${token}\`,
                      'Content-Type': 'application/json',
                    },
                  });
                  const data = await response.json();
                  if (data.pendingUsers) {
                    document.dispatchEvent(new CustomEvent('updatePendingUsers', { detail: data.pendingUsers }));
                    document.dispatchEvent(new CustomEvent('updateLoggedInWebsite', { detail: data.loggedInWebsite }));
                  }
                }, 5000);
              `,
            }}
          />
        </div>
      </PageLoader>
    </Suspense>
  );
}