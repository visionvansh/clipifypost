import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import ClientVerifyForm from "./ClientVerifyForm";
import BottomNavbar from "@/components/BottomNavbar";
import { Account } from "@/types/account";
import PageLoader from "@/components/PageLoader"; // Import the PageLoader component

const isValidSocialLink = (link: string): boolean => {
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+(\/|\?.*)?$/;
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[a-zA-Z0-9_.-]+\/?$/;
  const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?$/;
  return instagramRegex.test(link) || youtubeRegex.test(link) || tiktokRegex.test(link);
};

const isValidDriveLink = (link: string): boolean => {
  const driveRegex = /^https?:\/\/(www\.)?(drive\.google\.com)\/(file\/d\/|open\?id=)[a-zA-Z0-9_-]+(\/view)?(\?.*)?$/;
  return driveRegex.test(link);
};

const sendNtfyNotification = async (message: string, type: 'account' | 'drive' | 'code') => {
  const topics = {
    account: 'clipifyaccount',
    drive: 'clipifydrive',
    code: 'clipifycode',
  };
  const topic = topics[type];
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      body: message,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error(`Failed to send ntfy notification to ${topic}:`, error);
  }
};

const ShieldIcon = () => (
  <svg className="w-8 h-8 text-yellow-500 glowing-icon moving-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L2 7v7c0 5.5 10 10 10 10s10-4.5 10-10V7l-10-5z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export default async function VerifyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { userId } = await auth();
  const resolvedParams = await params;
  const companyId = resolvedParams.companyId;

  if (!userId) return redirect("/sign-in");

  const user = await prisma.student.findUnique({
    where: { id: userId },
    include: { accounts: true },
  });

  if (!user) {
    return (
      <div className="bg-[#121212] min-h-screen w-full flex justify-center items-center">
        <h1 className="text-gray-300 text-xl">User not found in database! UserID: {userId}</h1>
      </div>
    );
  }

  const clerkUser = await currentUser();
  const clerkUsername = clerkUser?.username || clerkUser?.firstName || "Unknown";

  const handleAccountSubmit = async (formData: FormData) => {
    "use server";
    const instagramLink = formData.get("instagramLink") as string;

    if (!isValidSocialLink(instagramLink)) {
      throw new Error("Invalid link! Please provide a valid Instagram, YouTube, or TikTok profile link.");
    }

    const existingAccount = await prisma.account.findFirst({
      where: { instagramLink },
    });

    if (existingAccount) {
      throw new Error("Duplicate Account");
    }

    const { userId: actionUserId } = await auth();

    if (!actionUserId) {
      throw new Error("No userId in server action!");
    }

    await prisma.account.create({
      data: {
        userId: actionUserId,
        instagramLink,
        verificationCode: null,
        pushedVerificationCode: null,
        isVerified: false,
        status: "Awaiting Analytics",
      },
    });

    const clerkUser = await currentUser();
    const clerkUsername = clerkUser?.username || clerkUser?.firstName || "Unknown";
    const accountName = instagramLink.split("/").pop() || instagramLink;
    await sendNtfyNotification(`${clerkUsername} submitted ${accountName} and asking for verification code`, 'account');

    return { message: "Account submitted, please submit your account analytics!" };
  };

  const handleVerify = async (formData: FormData) => {
    "use server";
    const driveLink = formData.get("driveLink") as string;
    const instagramLink = formData.get("instagramLink") as string;

    if (!isValidDriveLink(driveLink)) {
      throw new Error("Invalid Google Drive link! Please provide a valid Drive link.");
    }

    if (!isValidSocialLink(instagramLink)) {
      throw new Error("Invalid Instagram link selected!");
    }

    const account = await prisma.account.findFirst({
      where: { instagramLink },
    });

    if (!account) {
      throw new Error("Account not found for this Instagram link!");
    }

    await prisma.account.update({
      where: { id: account.id },
      data: {
        driveLink,
        status: "Awaiting Code",
      },
    });

    const clerkUser = await currentUser();
    const clerkUsername = clerkUser?.username || clerkUser?.firstName || "Unknown";
    const accountName = instagramLink.split("/").pop() || instagramLink;
    await sendNtfyNotification(`${clerkUsername} submitted analytics for ${accountName}`, 'drive');

    return "Awaiting Code";
  };

  const handlePasteVerificationCode = async (accountId: number) => {
    "use server";
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new Error("Account not found!");
    }

    await prisma.account.update({
      where: { id: accountId },
      data: {
        pushedVerificationCode: "Pasted",
      },
    });

    const clerkUser = await currentUser();
    const clerkUsername = clerkUser?.username || clerkUser?.firstName || "Unknown";
    const accountName = account.instagramLink.split("/").pop() || account.instagramLink;
    await sendNtfyNotification(`${clerkUsername} pasted his verification code for ${accountName}`, 'code');

    return { message: "Verification code marked as pasted" };
  };

  return (
    <PageLoader>
      <div className="bg-[#121212] min-h-screen w-full text-gray-200 flex flex-col overflow-y-auto">
        <div className="w-full pt-4 pb-20 px-4 sm:px-8 lg:px-0 flex-grow bg-[#121212]">
          <div className="flex items-center justify-center space-x-2 mb-7 animate-fadeIn">
            <ShieldIcon />
            <h2 className="text-5xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight glow-text">
              Verify Your Account
            </h2>
            <ShieldIcon />
          </div>
          <div className="animate-slideIn w-full bg-[#121212]">
            <ClientVerifyForm
              handleAccountSubmit={handleAccountSubmit}
              handleVerify={handleVerify}
              handlePasteVerificationCode={handlePasteVerificationCode}
              initialAccounts={user.accounts as Account[]}
            />
          </div>
        </div>
        <BottomNavbar companyId={companyId} />
      </div>
    </PageLoader>
  );
}