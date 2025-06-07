import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import BrandCard from "@/components/BrandCard";
import { Suspense } from "react";
import PageLoader from "@/components/PageLoader";
import { MdEdit } from "react-icons/md";

type Brand = {
  id: number;
  name: string;
  description?: string | null;
  moreDetails?: string | null;
  rate: number;
};

interface AddSocialProfilePageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const AddSocialProfilePage = async ({
  searchParams: searchParamsPromise,
}: AddSocialProfilePageProps) => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="text-white text-center mt-10 text-xl bg-black min-h-screen">
        Please log in to view Editors Hub.
      </div>
    );
  }

  try {
    const brands = await prisma.brand.findMany({
      where: { status: "Active" },
      select: {
        id: true,
        name: true,
        description: true,
        moreDetails: true,
        rate: true,
      },
    });

    console.log("Fetched Brands:", brands.map((b) => ({ name: b.name, moreDetails: b.moreDetails?.slice(0, 50) })));

    return (
      <PageLoader>
        <div className="bg-black w-full min-h-screen overflow-hidden">
          <div className="p-6 h-full overflow-y-auto text-white">
            <div className="w-full mx-auto space-y-8">
              <div className="flex items-center justify-start mb-4 sm:mb-2">
                <MdEdit className="w-6 h-6 text-yellow-500 glowing-icon twinkling-icon" />
                <h2 className="text-2xl md:text-4xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-600 animate-gradient tracking-tight animate-glow ml-3">
                  EDITORS HUB
                </h2>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 animate-glow"></div>
              {brands.length === 0 ? (
                <div className="text-white text-center text-xl">
                  No active brands available. Please contact support.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Suspense
                    fallback={
                      <div className="text-white text-center text-xl">
                        Loading brands...
                      </div>
                    }
                  >
                    {brands.map((brand) => (
                      <BrandCard
                        key={brand.id}
                        brand={{
                          id: brand.id,
                          name: brand.name,
                          description: brand.description
                            ? brand.description.split(/\./).filter((s) => s.trim())
                            : [],
                          moreDetails: brand.moreDetails,
                          rate: brand.rate,
                        }}
                      />
                    ))}
                  </Suspense>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageLoader>
    );
  } catch (error) {
    console.error("Error fetching brands:", error);
    return (
      <div className="text-white text-center mt-10 text-xl bg-black min-h-screen">
        Error loading brands. Please try again later.
      </div>
    );
  }
};

export default AddSocialProfilePage;