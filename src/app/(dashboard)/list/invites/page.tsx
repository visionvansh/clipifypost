import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { MdOutlinePeople } from 'react-icons/md';
import InvitedToServerCard from '@/components/InvitedToServerCard';
import LoggedInWebsiteCard from '@/components/LoggedInWebsiteCard';
import PendingUsersCard from '@/components/PendingUsersCard';
import ApprovedReferredCard from '@/components/ApprovedReferredCard';
import TotalEarningsCard from '@/components/TotalEarningsCard';
import { DashboardData } from '@/types/dashboard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const Invites = async ({ searchParams }: { searchParams: Promise<{ userId?: string; token?: string }> }) => {
  try {
    const { userId: authUserId, getToken } = await auth();

    if (!authUserId) {
      console.log('Unauthenticated user, showing Discord connect UI');
      return (
        <div className="bg-black min-h-screen flex flex-col items-center justify-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight mb-6">
            Connect to Discord
          </h1>
          <Link
            href="/api/auth/discord"
            className="bg-gradient-to-r from-blue-400 to-purple-600 text-white px-6 py-3 rounded-full hover:from-blue-500 hover:to-purple-700 transition-all duration-200 shadow-md text-lg font-poppins"
          >
            Connect Discord
          </Link>
        </div>
      );
    }

    console.log('Authenticated user ID:', authUserId);

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

    console.log('Student data:', JSON.stringify(student, null, 2));

    if (!student) {
      console.log('Student not found for authUserId:', authUserId);
      return (
        <div className="bg-black min-h-screen flex items-center justify-center text-white">
          <p className="text-xl font-poppins text-red-400">User not found</p>
        </div>
      );
    }

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
    console.log('LoggedInWebsite count:', loggedInWebsite);

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
    console.log('Invited students:', JSON.stringify(invitedStudents, null, 2));

    const pendingUsers = [];
    for (const invite of allInvites) {
      const invitedStudent = invitedStudents.find((s) => s.id === invite.invitedId);
      if (!invitedStudent) {
        console.warn(`No Student found for Invite.invitedId: ${invite.invitedId}`);
        continue;
      }
      console.log(`Processing invite ${invite.id}, Student.id: ${invitedStudent.id}, discordUsername: ${invitedStudent.discordUsername}`);

      const totalViews = await prisma.userStatsRecord.aggregate({
        where: { clerkUserId: invitedStudent.id },
        _sum: { totalViews: true },
      });
      const views = totalViews._sum.totalViews ?? 0;
      console.log(`Fetched totalViews for Invite ${invite.id}, Student.id: ${invitedStudent.id}, clerkUserId: ${invitedStudent.id}, totalViews: ${views}`);

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
          console.log('Updated Invite status:', {
            inviteId: invite.id,
            username: invitedStudent?.username || invite.invitedUsername,
            totalViews: views,
            status: newStatus,
            previousStatus: invite.status,
          });
        });
      } else {
        console.log(`No status update needed for Invite ${invite.id}, already ${newStatus}`);
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
        const pendingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/invites/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        if (pendingResponse.ok) {
          pendingUsersData = await pendingResponse.json();
          console.log('Pending users response:', JSON.stringify(pendingUsersData, null, 2));
        } else {
          throw new Error(`Pending users fetch failed: ${pendingResponse.status}`);
        }
      } else {
        console.warn('No Clerk JWT token, using local pendingUsers');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      pendingUsersData.pendingUsers = pendingUsers;
      pendingUsersData.approvedUsers = await prisma.invite.count({
        where: { inviterId: authUserId, status: 'approved' },
      });
      console.log('Fallback pending users:', JSON.stringify(pendingUsersData, null, 2));
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
    const earnings = approvedUsersCount * 0.23;
    console.log(`Calculated earnings: ${approvedUsersCount} approved users * $0.23 = $${earnings}`);

    const dashboardData: DashboardData = {
      discordUsername: student.discordUsername || 'N/A',
      inviteLink: student.inviteLinks[0]?.inviteLink || '',
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

    console.log('Dashboard data:', JSON.stringify(dashboardData, null, 2));

    return (
      <div className="bg-black min-h-screen w-full flex flex-col p-4 md:p-6 text-white overflow-y-auto">
        <div className="flex justify-between items-center space-x-2 md:space-x-3 mb-6">
          <div className="flex items-center space-x-2 md:space-x-3">
            <img
              src="/yellowlogo/logo.png"
              alt="Logo"
              className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover animate-logo-glow"
            />
            <h1 className="text-3xl md:text-5xl font-bold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight">
              INVITES
            </h1>
          </div>
          <div className="flex space-x-2">
            {dashboardData.discordUsername && dashboardData.discordUsername !== 'N/A' ? (
              <>
                <div className="text-sm md:text-base bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full shadow-md">
                  Connected to {dashboardData.discordUsername}
                </div>
                <form action="/api/auth/discord/disconnect" method="POST">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-red-400 to-red-600 text-white px-4 py-2 rounded-full hover:from-red-500 hover:to-red-700 transition-all duration-200 shadow-md"
                  >
                    Disconnect Discord
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/api/auth/discord"
                className="bg-gradient-to-r from-blue-400 to-purple-600 text-white px-4 py-2 rounded-full hover:from-blue-500 hover:to-purple-700 transition-all duration-200 shadow-md"
              >
                Connect Discord
              </Link>
            )}
          </div>
        </div>

        {dashboardData.inviteLink && (
          <div className="mt-4 bg-gray-800 p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-white font-poppins">Your Invite Link</h3>
            <p className="text-sm text-gray-300 font-medium break-all">{dashboardData.inviteLink}</p>
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-extrabold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-600 tracking-tight mt-6 md:mt-8 mb-3 md:mb-4">
          <span className="text-white mr-2">🤝</span>
          REFERRAL OVERVIEW
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 w-full">
          <InvitedToServerCard inviteCount={dashboardData.inviteCount} />
          <LoggedInWebsiteCard loggedInWebsite={dashboardData.loggedInWebsite} />
          <PendingUsersCard pendingUsers={dashboardData.pendingUsers} />
           <ApprovedReferredCard approvedUsers={dashboardData.approvedUsers.length} />
          <TotalEarningsCard earnings={dashboardData.earnings} />
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
    );
  } catch (error) {
    console.error('Error rendering invites page:', error);
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <p className="text-xl font-poppins text-red-400">Error loading invites. Please try again.</p>
      </div>
    );
  }
};

export default Invites;