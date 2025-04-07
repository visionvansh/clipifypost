import Table from "@/components/Table";
import Pagination from "@/components/Pagination";
import prisma from "@/lib/prisma";
import { updateClipStatus } from "@/lib/adminActions";
import { revalidatePath } from "next/cache";

async function getClips(accountId: number) {
  return prisma.clip.findMany({
    where: { accountId },
    select: {
      id: true,
      link: true,
      views: true,
      previousApprovedViews: true, // Added
      status: true,
      companyId: true,
    },
  });
}

async function getAccountDetails(accountId: number) {
  return prisma.account.findUnique({
    where: { id: accountId },
    select: { userId: true },
  });
}

export default async function LinksPage({ searchParams }: { searchParams: { accountId: string } }) {
  const accountId = parseInt(searchParams.accountId);
  if (!accountId) return <div className="text-[#e0e0e0] bg-[#1a1a1a] p-6">Missing account ID</div>;

  const clips = await getClips(accountId);
  const account = await getAccountDetails(accountId);
  const userId = account?.userId;

  async function handleClipStatus(formData: FormData) {
    "use server";
    const clipId = parseInt(formData.get("clipId") as string);
    const status = formData.get("status") as "approved" | "rejected";

    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      select: { accountId: true, views: true, previousApprovedViews: true, companyId: true, status: true },
    });

    if (!clip) return;

    await prisma.clip.update({
      where: { id: clipId },
      data: {
        status,
        previousApprovedViews: status === "approved" ? clip.views : clip.previousApprovedViews,
      },
    });

    const account = await prisma.account.findUnique({
      where: { id: clip.accountId },
      select: { userId: true },
    });

    if (!account || !account.userId) return;

    const company = await prisma.company.findUnique({
      where: { id: clip.companyId },
      select: { rate: true },
    });
    const rate = company ? parseFloat(company.rate.replace("$", "")) || 0 : 0;
    const clipRevenue = (clip.views / 100000) * rate;

    if (status === "approved" && clip.status !== "approved") {
      const attendanceRecords = await prisma.attendance.findMany({
        where: { studentId: account.userId },
      });

      if (attendanceRecords.length > 0) {
        for (const record of attendanceRecords) {
          const existingViews = parseInt(record.views || "0", 10) || 0;
          let updatedViews = existingViews;

          if (clip.previousApprovedViews !== null) {
            updatedViews = existingViews - (clip.previousApprovedViews || 0) + clip.views;
          } else {
            updatedViews = existingViews + clip.views;
          }

          await prisma.attendance.update({
            where: { id: record.id },
            data: { views: updatedViews.toString() },
          });
        }
      } else {
        await prisma.attendance.create({
          data: {
            id: `${account.userId}-${clipId}`,
            studentId: account.userId,
            socialAccountName: "default",
            nameOfPerson: "default",
            views: clip.views.toString(),
          },
        });
      }

      const resultRecords = await prisma.result.findMany({
        where: { studentId: account.userId },
      });

      if (resultRecords.length > 0) {
        for (const record of resultRecords) {
          const existingRevenue = parseFloat(record.revenue || "0") || 0;
          let updatedRevenue = existingRevenue;

          if (clip.previousApprovedViews !== null) {
            const previousRevenue = ((clip.previousApprovedViews || 0) / 100000) * rate;
            updatedRevenue = existingRevenue - previousRevenue + clipRevenue;
          } else {
            updatedRevenue = existingRevenue + clipRevenue;
          }

          await prisma.result.update({
            where: { id: record.id },
            data: { revenue: updatedRevenue.toString() },
          });
        }
      } else {
        await prisma.result.create({
          data: {
            id: `${account.userId}-${clipId}`,
            studentId: account.userId,
            socialAccountName: "default",
            nameOfPerson: "default",
            revenue: clipRevenue.toString(),
          },
        });
      }
    } else if (status === "rejected" && clip.status === "approved") {
      const attendanceRecords = await prisma.attendance.findMany({
        where: { studentId: account.userId },
      });

      for (const record of attendanceRecords) {
        const existingViews = parseInt(record.views || "0", 10) || 0;
        const updatedViews = Math.max(existingViews - clip.views, 0);
        await prisma.attendance.update({
          where: { id: record.id },
          data: { views: updatedViews.toString() },
        });
      }

      const resultRecords = await prisma.result.findMany({
        where: { studentId: account.userId },
      });

      for (const record of resultRecords) {
        const existingRevenue = parseFloat(record.revenue || "0") || 0;
        const updatedRevenue = Math.max(existingRevenue - clipRevenue, 0);
        await prisma.result.update({
          where: { id: record.id },
          data: { revenue: updatedRevenue.toString() },
        });
      }
    }

    revalidatePath("/list/checking/companies/accounts/links");
  }

  async function handleClipDelete(formData: FormData) {
    "use server";
    const clipId = parseInt(formData.get("clipId") as string);

    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      select: { accountId: true, views: true, companyId: true, status: true },
    });

    if (!clip) return;

    await prisma.clip.delete({
      where: { id: clipId },
    });

    if (clip.status === "approved") {
      const account = await prisma.account.findUnique({
        where: { id: clip.accountId },
        select: { userId: true },
      });

      if (!account || !account.userId) return;

      const company = await prisma.company.findUnique({
        where: { id: clip.companyId },
        select: { rate: true },
      });
      const rate = company ? parseFloat(company.rate.replace("$", "")) || 0 : 0;
      const clipRevenue = (clip.views / 100000) * rate;

      const attendanceRecords = await prisma.attendance.findMany({
        where: { studentId: account.userId },
      });

      for (const record of attendanceRecords) {
        const existingViews = parseInt(record.views || "0", 10) || 0;
        const updatedViews = Math.max(existingViews - clip.views, 0);
        await prisma.attendance.update({
          where: { id: record.id },
          data: { views: updatedViews.toString() },
        });
      }

      const resultRecords = await prisma.result.findMany({
        where: { studentId: account.userId },
      });

      for (const record of resultRecords) {
        const existingRevenue = parseFloat(record.revenue || "0") || 0;
        const updatedRevenue = Math.max(existingRevenue - clipRevenue, 0);
        await prisma.result.update({
          where: { id: record.id },
          data: { revenue: updatedRevenue.toString() },
        });
      }
    }

    revalidatePath("/list/checking/companies/accounts/links");
  }

  async function handleUpdateViews(formData: FormData) {
    "use server";
    const clipId = parseInt(formData.get("clipId") as string);
    const newViews = parseInt(formData.get("views") as string);

    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      select: { status: true, views: true },
    });

    if (!clip) return;

    await prisma.clip.update({
      where: { id: clipId },
      data: {
        views: newViews,
        previousApprovedViews: clip.status === "approved" ? clip.views : undefined,
        status: clip.status === "approved" ? "pending" : clip.status,
      },
    });

    revalidatePath("/list/checking/companies/accounts/links");
  }

  const columns = [
    { header: "Link", accessor: "link", className: "min-w-[300px]" },
    { header: "Views", accessor: "views", className: "min-w-[100px]" },
    { header: "Status", accessor: "status", className: "min-w-[120px]" },
    { header: "Actions", accessor: "actions", className: "min-w-[200px]" },
  ];

  const renderRow = (clip: any) => (
    <tr
      key={clip.id}
      className="border-b border-gray-700 even:bg-gray-800 text-sm hover:bg-gray-700 transition-all"
    >
      <td className="text-gray-300 p-4">{clip.link}</td>
      <td className="text-gray-400">{clip.views}</td>
      <td className="text-gray-400 capitalize">{clip.status}</td>
      <td>
        <div className="flex gap-2 flex-wrap">
          {clip.status === "pending" ? (
            <>
              <form action={handleClipStatus}>
                <input type="hidden" name="clipId" value={clip.id} />
                <input type="hidden" name="status" value="approved" />
                <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 text-sm">
                  ✅ Approve
                </button>
              </form>
              <form action={handleClipStatus}>
                <input type="hidden" name="clipId" value={clip.id} />
                <input type="hidden" name="status" value="rejected" />
                <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500 text-sm">
                  ❌ Reject
                </button>
              </form>
            </>
          ) : null}
          <form action={handleUpdateViews} className="flex gap-1">
            <input type="hidden" name="clipId" value={clip.id} />
            <input
              type="number"
              name="views"
              defaultValue={clip.views}
              className="w-20 p-1 bg-gray-700 text-gray-200 border border-gray-600 rounded text-sm"
              required
            />
            <button className="bg-orange-600 text-white px-2 py-1 rounded hover:bg-orange-500 text-sm">
              Update
            </button>
          </form>
          <form action={handleClipDelete}>
            <input type="hidden" name="clipId" value={clip.id} />
            <button className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500 text-sm">
              🗑️ Delete
            </button>
          </form>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-gray-900 min-h-screen w-full flex justify-center">
      <div className="bg-gray-900 p-4 rounded-md flex-1 m-4 mt-0 max-w-7xl w-full">
        <div className="flex flex-col gap-2 w-full mb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-300">
            Clip Links 🎞️
          </h1>
          <div className="text-sm text-gray-400 space-x-2">
            <a href="/list/checking" className="text-blue-500 hover:underline">Users</a> /
            <a href={`/list/checking/companies?userId=${userId}`} className="text-blue-500 hover:underline"> Companies</a> /
            <a href={`/list/checking/companies/accounts?userId=${userId}&companyId=${clips[0]?.companyId}`} className="text-blue-500 hover:underline"> Accounts</a> /
            <span className="text-white">Links</span>
          </div>
        </div>

        <div className="overflow-x-auto bg-gray-900 rounded-md">
          <Table columns={columns} renderRow={renderRow} data={clips} />
        </div>

        {userId && clips.length > 0 && (
          <a
            href={`/list/checking/companies/accounts?userId=${userId}&companyId=${clips[0].companyId}`}
            className="mt-6 inline-block text-blue-500 hover:underline text-sm"
          >
            ← Back to Accounts
          </a>
        )}
      </div>
    </div>
  );
}