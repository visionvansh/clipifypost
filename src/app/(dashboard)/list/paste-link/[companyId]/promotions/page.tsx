import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function PromotionsPage({ params }: { params: { companyId: string } }) {
  const authData = await auth();
  const userId = authData.userId;
  const companyId = parseInt(params.companyId);

  if (!userId) return redirect("/sign-in");

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return (
      <div className="bg-black min-h-screen flex justify-center items-center">
        <h1 className="text-gray-300 text-2xl">Company not found! CompanyID: {companyId}</h1>
      </div>
    );
  }

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      {/* Navbar */}
      <nav className="w-full bg-[#1a1a1a]/90 backdrop-blur-md py-4 px-4 flex flex-col items-center gap-4 fixed top-0 z-10 shadow-lg border-b border-[#333333] sm:flex-row sm:justify-center sm:gap-12">
        <Link className="lg:ml-[-330px]" href={`/list/paste-link/${companyId}/verify`}>
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-900 transition-all shadow-md text-lg font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl">
            Verify 🔥
          </div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/paste-links`}>
          <div className="bg-gradient-to-r from-green-600 to-green-800 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-900 transition-all shadow-md text-lg font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl">
            Paste Links 📎
          </div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/promotions`}>
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-900 transition-all shadow-md text-lg font-semibold tracking-wide transform hover:scale-105 hover:shadow-xl">
            Promotions ✨
          </div>
        </Link>
      </nav>

      {/* Scrollable Full Page Content */}
      <div  className="pt-48 sm:pt-24 px-4 sm:px-8 h-full overflow-y-auto text-white pb-20">
        {/* Full Width Company Image */}
        <div className="relative w-full h-64 sm:h-96 mb-6 border-2 border-red-600 rounded-xl overflow-hidden">
          <Image
            src={company.image}
            alt={company.name}
            layout="fill"
            objectFit="cover"
            className="rounded-xl"
          />
        </div>

        {/* Promotion Details Section */}
        <div className="bg-gray-900 p-6 rounded-xl mb-6 border border-gray-700 w-full">
          <h2 className="text-2xl font-semibold mb-2">📣 Promotion Details</h2>
          <p className="text-gray-300 leading-relaxed text-base">{company.description}</p>
        </div>

        {/* Payment Info Section */}
        <div className="bg-gray-900 p-6 rounded-xl mb-6 border-l-4 border-red-600 w-full">
          <h2 className="text-xl font-semibold mb-2">💵 Payment Details</h2>
          <p className="text-gray-200 text-base">
            You’ll earn <span className="font-bold text-red-400">${company.rate}</span> per 100K views.
          </p>
        </div>

        {/* Content Link Section */}
        <div className="bg-gray-900 p-6 rounded-xl mb-6 border border-gray-700 w-full">
          <h2 className="text-xl font-semibold mb-2">🎬 Download Content</h2>
          <Link href={company.contentLink} target="_blank">
            <div className="bg-gray-800 px-5 py-2 mt-3 rounded-md text-center hover:bg-gray-700 cursor-pointer w-fit text-white">
              Open Google Drive 📁
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
