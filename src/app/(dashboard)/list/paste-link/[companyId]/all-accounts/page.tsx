import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

type Account = {
  id: number;
  instagramLink: string;
  isVerified: boolean;
  status: string;
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

export default async function AllAccountsPage({ params }: { params: { companyId: string } }) {
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

      {/* Main Content */}
      <div className="w-full max-w-6xl mx-auto pt-28 sm:pt-16 pb-4 px-4 sm:px-6 flex-grow">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">All Your Accounts 📋</h2>
        {user.accounts.length === 0 ? (
          <p className="text-gray-400 text-sm">No accounts submitted yet. 😢</p>
        ) : (
          <ul className="w-full space-y-3">
            {user.accounts.map((account) => (
              <li
                key={account.id}
                className={`w-full p-3 rounded-lg flex justify-between items-center border border-[#333333] shadow-sm ${
                  account.isVerified ? "bg-green-900/20 text-green-300" : "bg-orange-900/20 text-orange-300"
                }`}
              >
                <span className="font-semibold text-sm truncate">{extractUsername(account.instagramLink)}</span>
                <span className="text-xs">{account.status} {account.isVerified ? "✅" : "⏳"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}