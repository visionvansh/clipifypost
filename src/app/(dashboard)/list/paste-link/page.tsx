import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import PageLoader from "@/components/PageLoader";
import { MdCloudUpload } from "react-icons/md";
import CompanyCard from "@/components/CompanyCard";

type Company = {
  id: number;
  name: string;
  description: string;
  rate: string;
  image: string;
  status: "Active" | "Stopped";
  createdAt: Date;
  updatedAt: Date;
};

export default async function PasteLinkPage() {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const role = clerkUser?.publicMetadata.role as string | undefined;

  console.log("PasteLinkPage - Auth userId:", userId);
  console.log("PasteLinkPage - Clerk user:", clerkUser?.id);
  console.log("PasteLinkPage - Role:", role);
  console.log("PasteLinkPage - Has user and role?", !!clerkUser, !!role);

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

  const companies = await prisma.company.findMany({
    where: { status: "Active" }, // Only fetch Active companies
  });

  if (companies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <h1 className="text-gray-300 text-xl sm:text-2xl font-medium">
          No active companies found in the database!
        </h1>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="bg-black min-h-screen flex items-center justify-center" />}>
      <PageLoader>
        <div className="bg-black relative w-full h-full">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black opacity-50"></div>
          <div className="p-4 sm:p-6 h-full overflow-y-auto text-white max-w-full mx-auto relative z-0">
            <div className="flex items-center justify-start mb-4 sm:mb-8">
              <MdCloudUpload className="text-2xl md:text-4xl text-yellow-500 glowing-icon twinkling-icon ml-2 mt-4" />
              <h2 className="text-2xl md:text-4xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600 animate-gradient tracking-tight animate-glow ml-3">
                UPLOADERS HUB
              </h2>
            </div>
            <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4 md:mb-6 animate-glow"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-10 justify-items-center">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </div>
        </div>
      </PageLoader>
    </Suspense>
  );
}