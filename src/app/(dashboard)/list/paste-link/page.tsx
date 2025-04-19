import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

export default async function PasteLinkPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <h1 className="text-gray-300 text-xl font-medium">
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
        <h1 className="text-gray-300 text-xl font-medium text-center">
          User not found in database! <br /> UserID: {userId}
        </h1>
      </div>
    );
  }

  const companies = await prisma.company.findMany();

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <h1 className="text-gray-300 text-xl font-medium">
          No companies found in the database!
        </h1>
      </div>
    );
  }

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white max-w-7xl mx-auto">
        <h1 className="text-6xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight transform rotate-3d mb-12 gap-3">
          Promote Companies, Earn with Clips! <span>🎥</span>
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-[#15151b] p-7 rounded-3xl shadow-lg hover:shadow-[0_0_35px_#1e90ff44] transition-all duration-300 transform hover:-translate-y-2"
            >
              <Image
                src={company.image}
                alt={company.name}
                width={260}
                height={260}
                className="rounded-xl mx-auto"
              />
              <h2 className="text-2xl font-semibold text-gray-100 mt-6 text-center">
                {company.name}
              </h2>
              {company.description ? (
                <div className="flex flex-wrap gap-2 mt-1 mb-3 justify-center">
                  {company.description.split(/[,.]/).map((sentence, index) =>
                    sentence.trim() ? (
                      <div
                        key={index}
                        className="px-3 py-1 text-sm rounded-full font-medium text-gray-200 bg-gray-900 border border-gray-500 hover:bg-opacity-80 transition-colors duration-200"
                      >
                        {sentence.trim()}
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center text-sm mt-1 mb-3">
                  No description available
                </p>
              )}
              <Link href={`/list/paste-link/${company.id}/verify`}>
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 text-white px-7 py-3 rounded-full shadow-lg hover:shadow-2xl transition-all mt-7 mx-auto w-fit text-center cursor-pointer text-sm font-medium tracking-wide">
                  🚀 Get Started
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}