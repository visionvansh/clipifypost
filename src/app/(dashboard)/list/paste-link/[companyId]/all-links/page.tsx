import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientAllLinksTable from "./ClientAllLinksTable";
import { revalidatePath } from "next/cache";

type Clip = {
  id: number;
  accountId: number;
  link: string;
  views: number;
  previousApprovedViews: number | null; // Added
  status: string;
  account: { instagramLink: string };
};

export default async function AllLinksPage({ params }: { params: { companyId: string } }) {
  const { userId } = await auth();
  const companyId = parseInt(params.companyId);

  if (!userId) return redirect("/sign-in");

  const user = await prisma.student.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#000]">
        <h1 className="text-gray-300 text-2xl">User not found! UserID: {userId}</h1>
      </div>
    );
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#000]">
        <h1 className="text-gray-300 text-2xl">Company not found! CompanyID: {companyId}</h1>
      </div>
    );
  }

  const initialClips = await prisma.clip.findMany({
    where: { companyId, accountId: { in: user.accounts.map((acc) => acc.id) } },
    include: { account: true },
    orderBy: { id: "desc" },
  });

  const handleUpdateViews = async (formData: FormData) => {
    "use server";
    const clipId = parseInt(formData.get("clipId") as string);
    const views = parseInt(formData.get("views") as string);
    const companyId = parseInt(params.companyId);

    const clip = await prisma.clip.findUnique({
      where: { id: clipId },
      select: { status: true, views: true },
    });

    if (!clip) throw new Error("Clip not found!");

    const updatedClip = await prisma.clip.update({
      where: { id: clipId },
      data: {
        views,
        status: clip.status === "approved" ? "pending" : clip.status,
        previousApprovedViews: clip.status === "approved" ? clip.views : undefined,
      },
      include: { account: true },
    });

    revalidatePath(`/list/paste-link/${companyId}/all-links`);
    return { message: "Views updated, awaiting admin approval!", clip: updatedClip };
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#000] overflow-x-hidden">
      <div className="bg-[#121212] p-4 sm:p-6 max-w-7xl w-full">
        <div className="w-full flex flex-wrap justify-center gap-4 sm:gap-6 p-4 bg-[#121212] mt-16">
          <Link href={`/list/paste-link/${companyId}/verify`} className="w-auto">
            <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-3 rounded-full hover:from-blue-600 hover:to-blue-800 text-lg font-medium text-center">
              Verify 🔥
            </div>
          </Link>
          <Link href={`/list/paste-link/${companyId}/paste-links`} className="w-auto">
            <div className="bg-gradient-to-r from-green-500 to-green-700 text-white px-6 py-3 rounded-full hover:from-green-600 hover:to-green-800 text-lg font-medium text-center">
              Paste Links 📎
            </div>
          </Link>
          <Link href={`/list/paste-link/${companyId}/promotions`} className="w-auto">
            <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white px-6 py-3 rounded-full hover:from-purple-600 hover:to-blue-800 text-lg font-medium text-center">
              Promotions ✨
            </div>
          </Link>
        </div>

        <div className="bg-[#121212] rounded-md p-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-200 mb-6 text-center">
            All Submitted Links for {company.name} 📋
          </h2>
          <ClientAllLinksTable handleUpdateViews={handleUpdateViews} initialClips={initialClips} />
        </div>
      </div>
    </div>
  );
}