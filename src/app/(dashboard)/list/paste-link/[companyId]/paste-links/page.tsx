import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientPasteLinksForm from "./ClientPasteLinksForm";
import { revalidatePath } from "next/cache";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Account = {
  id: number;
  instagramLink: string;
  isVerified: boolean;
  status: string;
};

type Clip = {
  id: number;
  accountId: number;
  link: string;
  views: number;
  previousApprovedViews: number | null; // Added
  status: string;
  account: Account;
};

const extractUsername = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const username = path.split("/")[1];
    return username || url;
  } catch {
    return url;
  }
};

export default async function PasteLinksPage({ params }: { params: { companyId: string } }) {
  const { userId } = await auth();
  const companyId = parseInt(params.companyId);

  if (!userId) return redirect("/sign-in");

  const user = await prisma.student.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (!user) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center bg-[#000000]">
        <h1 className="text-gray-300 text-2xl">User not found! UserID: {userId}</h1>
      </div>
    );
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    return (
      <div className="min-h-screen w-full flex justify-center items-center bg-[#000000]">
        <h1 className="text-gray-300 text-2xl">Company not found! CompanyID: {companyId}</h1>
      </div>
    );
  }

  const initialClips = await prisma.clip.findMany({
    where: { companyId, accountId: { in: user.accounts.map((acc) => acc.id) } },
    include: { account: true },
    orderBy: { id: "desc" },
  });

  const handleClipSubmit = async (formData: FormData) => {
    "use server";
    const accountId = parseInt(formData.get("accountId") as string);
    const link = formData.get("link") as string;
    const views = parseInt(formData.get("views") as string);
    const companyId = parseInt(formData.get("companyId") as string);

    const existingClip = await prisma.clip.findFirst({ where: { link, companyId } });
    if (existingClip) {
      throw new Error("Duplicate link detected! Please use a unique link.");
    }

    const newClip = await prisma.clip.create({
      data: { accountId, companyId, link, views, status: "pending", previousApprovedViews: null },
      include: { account: true },
    });

    revalidatePath(`/list/paste-link/${companyId}/paste-links`);
    return { message: "Clip submitted successfully!", clip: newClip };
  };

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

    revalidatePath(`/list/paste-link/${companyId}/paste-links`);
    return { message: "Views updated, awaiting admin approval!", clip: updatedClip };
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#000000]">
      <nav className="w-full bg-[#1a1a1a]/90 backdrop-blur-md py-3 px-4 flex flex-col items-center gap-3 fixed top-0 z-10 shadow-lg border-b border-[#333333] sm:flex-row sm:justify-center sm:gap-8">
        <Link className="lg:ml-[-330px]" href={`/list/paste-link/${companyId}/verify`}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all shadow-md text-base font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl flex items-center gap-1 w-full sm:w-auto text-center justify-center">
            Verify 🔥
          </div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/paste-links`}>
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-900 transition-all shadow-md text-base font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl flex items-center gap-1 w-full sm:w-auto text-center justify-center">
            Paste Links 📎
          </div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/promotions`}>
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all shadow-md text-base font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl flex items-center gap-1 w-full sm:w-auto text-center justify-center">
            Promotions ✨
          </div>
        </Link>
      </nav>

      <div className="w-full max-w-4xl mx-auto pt-20 sm:pt-14 pb-4 px-4 sm:px-6 flex-grow">
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-200 mb-3 sm:mb-4 text-center">
          Paste Links for {company.name} 📎
        </h2>
        <ClientPasteLinksForm
          handleClipSubmit={handleClipSubmit}
          handleUpdateViews={handleUpdateViews}
          initialAccounts={user.accounts}
          companyId={companyId}
          initialClips={initialClips}
        />
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  );
}