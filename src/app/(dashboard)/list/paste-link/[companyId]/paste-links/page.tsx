import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ClientPasteLinksForm from "./ClientPasteLinksForm";
import { revalidatePath } from "next/cache";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BottomNavbar from "@/components/BottomNavbar";
import PageLoader from "@/components/PageLoader";

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
  companyId: number;
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

const isValidClipLink = (link: string): boolean => {
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+(\/)?(\?.*)?$/;
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+(\/|\?.*)?$/;
  const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+(\/|\?.*)?$/;
  
  console.log("Validating link:", link, {
    instagram: instagramRegex.test(link),
    youtube: youtubeRegex.test(link),
    tiktok: tiktokRegex.test(link),
  });
  
  return instagramRegex.test(link) || youtubeRegex.test(link) || tiktokRegex.test(link);
};

const extractClipId = (link: string): string | null => {
  try {
    const parsedUrl = new URL(link);
    const path = parsedUrl.pathname;

    if (link.includes("instagram.com")) {
      const match = path.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
      console.log("Instagram match:", match);
      return match ? match[2] : null;
    }

    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      if (path.includes("/watch")) {
        const params = new URLSearchParams(parsedUrl.search);
        const id = params.get("v");
        console.log("YouTube watch ID:", id);
        return id || null;
      }
      const match = path.match(/\/(shorts\/)?([A-Za-z0-9_-]+)/);
      console.log("YouTube match:", match);
      return match ? match[2] : null;
    }

    if (link.includes("tiktok.com")) {
      const match = path.match(/\/video\/(\d+)/);
      console.log("TikTok match:", match);
      return match ? match[1] : null;
    }

    return null;
  } catch (error) {
    console.error("Error extracting clip ID:", error);
    return null;
  }
};

const sendNtfyNotification = async (message: string) => {
  try {
    await fetch("https://ntfy.sh/clipifyuploaders", {
      method: "POST",
      body: message,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Failed to send ntfy notification:", error);
  }
};

const LinkIcon = () => (
  <svg className="w-8 h-8 text-yellow-500 glowing-icon moving-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

export default async function PasteLinksPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { userId } = await auth();
  const { companyId: companyIdStr } = await params;
  const companyId = parseInt(companyIdStr);

  if (!userId) return redirect("/sign-in");

  const user = await prisma.student.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (!user) {
    return (
      <div className="bg-[#121212] min-h-screen w-full flex justify-center items-center">
        <h1 className="text-gray-300 text-xl">User not found! UserID: {userId}</h1>
      </div>
    );
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });

  if (!company) {
    return (
      <div className="bg-[#121212] min-h-screen w-full flex justify-center items-center">
        <h1 className="text-gray-300 text-xl">Company not found! CompanyID: {companyId}</h1>
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
    companyId,
    postedAt: clip.postedAt || new Date(),
  }));

  const handleClipSubmit = async (formData: FormData) => {
    "use server";
    const accountId = parseInt(formData.get("accountId") as string);
    const link = formData.get("link") as string;
    const views = parseInt(formData.get("views") as string);
    const companyId = parseInt(formData.get("companyId") as string);

    if (!isValidClipLink(link)) {
      throw new Error("Invalid clip link! Please provide a valid Instagram reel, YouTube video, or TikTok clip link.");
    }

    const clipId = extractClipId(link);
    if (!clipId) {
      throw new Error("Could not extract clip ID from the link!");
    }

    const existingClips = await prisma.clip.findMany({
      where: { companyId },
      select: { link: true },
    });
    const isDuplicate = existingClips.some((clip) => {
      const existingClipId = extractClipId(clip.link);
      return existingClipId === clipId;
    });
    if (isDuplicate) {
      throw new Error("Duplicate clip detected! This clip has already been submitted for this company.");
    }

    const newClip = await prisma.clip.create({
      data: {
        accountId,
        companyId,
        link,
        views,
        status: "pending",
        previousApprovedViews: null,
        postedAt: new Date(),
      },
      include: { account: true },
    });

    const clerkUser = await currentUser();
    const clerkUsername = clerkUser?.username || clerkUser?.firstName || "Unknown";
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const accountName = extractUsername(newClip.account.instagramLink);
    await sendNtfyNotification(`${clerkUsername} submitted clip link for ${company?.name || 'Unknown Company'} for account ${accountName}`);

    const formattedClip: Clip = {
      ...newClip,
      companyId,
      postedAt: newClip.postedAt || new Date(),
    };

    revalidatePath(`/list/paste-link/${companyId}/paste-links`);
    return { message: "Clip submitted successfully!", clip: formattedClip };
  };

  const handleUpdateViews = async (formData: FormData) => {
    "use server";
    const clipId = parseInt(formData.get("clipId") as string);
    const views = parseInt(formData.get("views") as string);
    const companyId = parseInt(companyIdStr);

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
      companyId,
      postedAt: updatedClip.postedAt || new Date(),
    };

    revalidatePath(`/list/paste-link/${companyId}/paste-links`);
    return { message: "Views updated, awaiting admin approval!", clip: formattedClip };
  };

  return (
    <PageLoader>
      <div className="bg-[#121212] min-h-screen w-full text-gray-200 flex flex-col overflow-y-auto">
        <div className="w-full pt-4 pb-20 px-4 sm:px-8 lg:px-0 flex-grow bg-[#121212]">
          <div className="flex items-center justify-center space-x-2 mb-7 animate-fadeIn">
            <LinkIcon />
            <h2 className="text-5xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight glow-text">
              Paste Links for {company.name}
            </h2>
            <LinkIcon />
          </div>
          <div className="animate-slideIn w-full bg-[#121212]">
            <ClientPasteLinksForm
              handleClipSubmit={handleClipSubmit}
              handleUpdateViews={handleUpdateViews}
              initialAccounts={user.accounts}
              companyId={companyId}
              initialClips={initialClips}
            />
          </div>
        </div>
        <BottomNavbar companyId={companyIdStr} />
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
    </PageLoader>
  );
}