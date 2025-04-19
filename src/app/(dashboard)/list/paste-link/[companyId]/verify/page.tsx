import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ClientVerifyForm from "./ClientVerifyForm";

const isValidSocialLink = (link: string): boolean => {
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+(\/|\?.*)?$/;
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[a-zA-Z0-9_.-]+\/?$/;
  const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9_.]+\/?$/;
  return instagramRegex.test(link) || youtubeRegex.test(link) || tiktokRegex.test(link);
};

export default async function VerifyPage({ params }: { params: { companyId: string } }) {
  const { userId } = await auth();
  const companyId = params.companyId;

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

    const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { userId: actionUserId } = await auth();

    if (!actionUserId) {
      throw new Error("No userId in server action!");
    }

    await prisma.account.create({
      data: {
        userId: actionUserId,
        instagramLink,
        verificationCode,
        isVerified: false,
        status: "Awaiting Bio Update",
      },
    });

    return verificationCode;
  };

  const handleVerify = async (formData: FormData) => {
    "use server";
    const instagramLink = formData.get("instagramLink") as string;

    const account = await prisma.account.findFirst({
      where: { instagramLink },
    });

    if (!account) {
      throw new Error("Account not found for this link!");
    }

    await prisma.account.update({
      where: { id: account.id },
      data: { status: "Pending" },
    });

    return "Pending";
  };

  const displayedAccounts = user.accounts.slice(0, 2);

  return (
    <div className="bg-[#121212] min-h-screen w-full text-gray-200 flex flex-col">
      {/* Fixed Glassmorphism Navbar */}
      <nav className="w-full bg-[#1a1a1a]/90 backdrop-blur-md py-4 px-4 flex flex-col items-center gap-4 fixed top-0 z-10 shadow-lg border-b border-[#333333] sm:flex-row sm:justify-center sm:gap-12">
        <Link className="lg:ml-[-330px]" href={`/list/paste-link/${companyId}/verify`}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all shadow-md text-lg font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl flex items-center gap-2 w-full sm:w-auto text-center justify-center">
            Verify 🔥
          </div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/paste-links`}>
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-900 transition-all shadow-md text-lg font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl flex items-center gap-2 w-full sm:w-auto text-center justify-center">
            Paste Links 📎
          </div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/promotions`}>
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all shadow-md text-lg font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl flex items-center gap-2 w-full sm:w-auto text-center justify-center">
            Promotions ✨
          </div>
        </Link>
      </nav>

      {/* Main Content with Adjusted Padding */}
      <div className="w-full max-w-6xl mx-auto pt-40 sm:pt-16 pb-4 px-4 sm:px-6 flex-grow">
        <h2 className="text-4xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-600 tracking-tight transform rotate-3d mb-7">
          Verify Your Account 🔥
        </h2>
        <ClientVerifyForm handleAccountSubmit={handleAccountSubmit} handleVerify={handleVerify} initialAccounts={displayedAccounts} />
        {user.accounts.length > 2 && (
          <div className="mt-4 flex justify-center">
            <Link href={`/list/paste-link/${companyId}/all-accounts`}>
              <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-full hover:from-blue-600 hover:to-blue-800 text-base font-medium">
                See More Accounts 🔍
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}