import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientAllLinksTable from "./ClientAllLinksTable";
import { revalidatePath } from "next/cache";

type Account = {
  id: number;
  userId: string;
  instagramLink: string;
  verificationCode: string | null;
  isVerified: boolean;
  status: string;
  driveLink: string | null;
};

type Clip = {
  id: number;
  accountId: number;
  link: string;
  views: number;
  previousApprovedViews: number | null;
  status: string;
  postedAt: Date;
  account: Account;
};

export default async function AllLinksPage({ params }: { params: Promise<{ companyId: string }> }) {
  const resolvedParams = await params;
  const companyId = parseInt(resolvedParams.companyId);
  const { userId } = await auth();

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

  const rawClips = await prisma.clip.findMany({
    where: { companyId, accountId: { in: user.accounts.map((acc) => acc.id) } },
    include: { account: true },
    orderBy: { id: "desc" },
  });

  const initialClips: Clip[] = rawClips.map((clip) => ({
    ...clip,
    postedAt: clip.postedAt || new Date(),
  }));

  const handleUpdateViews = async (formData: FormData) => {
    "use server";
    const clipId = parseInt(formData.get("clipId") as string);
    const views = parseInt(formData.get("views") as string);
    const companyId = parseInt(resolvedParams.companyId);

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

    const formattedClip: Clip = {
      ...updatedClip,
      postedAt: updatedClip.postedAt || new Date(),
    };

    revalidatePath(`/list/paste-link/${companyId}/all-links`);
    return { message: "Views updated, awaiting admin approval!", clip: formattedClip };
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-[#000] overflow-x-hidden">
      <ClientAllLinksTable handleUpdateViews={handleUpdateViews} initialClips={initialClips} />
    </div>
  );
}