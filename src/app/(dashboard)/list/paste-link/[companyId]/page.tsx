import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

const companies = [
  { id: 1, name: "Company X", image: "/company-x.png", rate: "₹10/1000 views" },
  { id: 2, name: "Company Y", image: "/company-y.png", rate: "₹15/1000 views" },
  { id: 3, name: "Company Z", image: "/company-z.png", rate: "₹20/1000 views" },
];

const PasteLinkPage = async () => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="bg-gray-900 min-h-screen w-full flex justify-center items-center">
        <h1 className="text-gray-300">Please sign in to continue!</h1>
      </div>
    );
  }

  const user = await prisma.student.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return (
      <div className="bg-gray-900 min-h-screen w-full flex justify-center items-center">
        <h1 className="text-gray-300">User not found in database! UserID: {userId}</h1>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen w-full flex justify-center p-6">
      <div className="w-full max-w-7xl">
        <h1 className="text-3xl font-bold text-gray-100 mb-6 flex items-center gap-2">
          Promote Companies, Earn with Clips! <span className="text-4xl">🎥</span>
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-gray-800 p-4 rounded-lg shadow-lg hover:bg-gray-700 transition-all border border-gray-700"
            >
              <Image src={company.image} alt={company.name} width={200} height={200} className="rounded-md mx-auto" />
              <h2 className="text-xl font-semibold text-gray-100 mt-4 text-center">{company.name}</h2>
              <p className="text-gray-400 text-center">{company.rate}</p>
              <Link href={`/list/paste-link/${company.id}/verify`}>
                <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-6 py-2 rounded-full shadow-lg hover:from-blue-600 hover:to-blue-800 transition-all mt-4 mx-auto w-fit cursor-pointer">
                  Get Started
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PasteLinkPage;