import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { MdAttachMoney } from "react-icons/md";
import PageLoader from "@/components/PageLoader";
import { MdCloudUpload } from "react-icons/md";
import { Suspense } from "react";

export default async function PasteLinkPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <h1 className="text-gray-300 text-xl sm:text-2xl font-medium">
          Please sign in to continue!
        </h1>
      </div>
    );
  }

  const user = await prisma.student.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <h1 className="text-gray-300 text-xl sm:text-2xl font-medium text-center">
          User not found in database! <br /> UserID: {userId}
        </h1>
      </div>
    );
  }

  const companies = await prisma.company.findMany();

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <h1 className="text-gray-300 text-xl sm:text-2xl font-medium">
          No companies found in the database!
        </h1>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center" />}>
      <PageLoader>
        <div className="bg-black fixed  top-0 left-0 w-full h-full overflow-hidden ">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
          <div className="p-4 sm:p-6 h-full overflow-y-auto text-white max-w-full mx-auto relative z-10">
            <div className="flex items-center justify-start mb-4 sm:mb-8">
              <MdCloudUpload className="text-2xl md:text-4xl text-yellow-500 glowing-icon twinkling-icon ml-2 mt-4" />
              <h2 className="text-2xl md:text-4xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600 animate-gradient tracking-tight animate-glow ml-3 mt-4">
                UPLOADERS HUB
              </h2>
            </div>
            <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4 md:mb-6 animate-glow"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-10 justify-items-center">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="bg-[#15151b] p-4 sm:p-6 rounded-3xl shadow-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all duration-300 transform hover:-translate-y-2 md:hover:-translate-y-4 float-animation pulse-animation w-full max-w-[420px] sm:max-w-xs lg:max-w-sm animate-fadeIn"
                >
                  <div className="relative">
                    <Image
                      src={company.image}
                      alt={company.name}
                      width={280}
                      height={280}
                      className="rounded-xl mx-auto max-w-full h-auto"
                    />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-3xl font-semibold text-gray-100 mt-4 sm:mt-6 text-center mb-4">
                    {company.name}
                  </h2>
                  {company.description ? (
                    <div className="flex flex-wrap gap-2 mt-1 mb-3 justify-start">
                      {company.description.split(/[,.]/).map((sentence, index) =>
                        sentence.trim() ? (
                          <div
                            key={index}
                            className="p-3 text-xs sm:text-sm rounded-full font-medium text-yellow-300 bg-black border border-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors duration-200"
                          >
                            {sentence.trim()}
                          </div>
                        ) : null
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center text-xs sm:text-sm mt-1 mb-3">
                      No description available
                    </p>
                  )}
                  <div className="bg-black bg-opacity-50 p-2 rounded-full flex items-center justify-center mt-2 mb-4">
                    <MdAttachMoney className="text-yellow-500 glowing-icon moving-icon" />
                    <p className="text-yellow-500 font-bold glow-text text-sm sm:text-lg">{company.rate} per 100k views</p>
                  </div>
                  <Link href={`/list/paste-link/${company.id}/verify`}>
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-300 hover:from-yellow-400 hover:to-yellow-200 text-black px-4 sm:px-7 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all mt-4 sm:mt-7 mx-auto w-full text-center cursor-pointer text-xs sm:text-sm font-medium tracking-wide button-hover">
                      🚀 Get Started
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageLoader>
    </Suspense>
  );
}