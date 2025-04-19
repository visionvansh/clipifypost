import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import UploadForm from "@/components/UploadForm";
import BrandCard from "@/components/BrandCard";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { Suspense } from "react";
import ViewsUpdateForm from "@/components/ViewsUpdateForm";

type UserReelWithBrand = Prisma.UserReelGetPayload<{
  include: { brand: { select: { name: true } } };
}>;

type Brand = {
  id: number;
  name: string;
};

interface AddSocialProfilePageProps {
  searchParams: { [key: string]: string | undefined };
}

const AddSocialProfilePage = async ({
  searchParams,
}: AddSocialProfilePageProps) => {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="text-white text-center mt-10 text-xl">
        Please log in to upload reels.
      </div>
    );
  }

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.UserReelWhereInput = { studentId: userId };

  if (queryParams.search) {
    query.videoUrl = { contains: queryParams.search, mode: "insensitive" };
  }

  const [reels, count, brands] = await prisma.$transaction([
    prisma.userReel.findMany({
      where: query,
      include: { brand: { select: { name: true } } },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.userReel.count({ where: query }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
  ]);

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white">
        <div className="max-w-7xl w-full mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight transform rotate-3d">
              Upload Your Reel 🎥 <span className="text-smfont-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-600 tracking-tight transform rotate-3d ml-2">(For Editors)</span>
            </h1>
            <div className="w-full md:w-auto">
              <TableSearch />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Suspense fallback={<div>Loading brands...</div>}>
              {brands.map((brand: Brand) => (
                <BrandCard key={brand.id} brand={brand} />
              ))}
            </Suspense>
          </div>

          <div className="backdrop-blur-md bg-gray-900 p-6 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/50 transform rotate-3d">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-300">
                    <th className="p-4 font-medium">Reel</th>
                    <th className="p-4 font-medium">Published Link</th>
                    <th className="p-4 font-medium">Brand</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Views</th>
                    <th className="p-4 font-medium">Uploaded</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reels.map((reel: UserReelWithBrand) => (
                    <tr
                      key={reel.id}
                      className="border-t border-gray-700/50 bg-gray-800/20 hover:bg-gray-700/30 transform hover:scale-[1.01] transition-all duration-300 rounded-lg rotate-3d"
                    >
                      <td className="p-4">
                        {reel.videoUrl ? (
                          <a
                            href={reel.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View Reel
                          </a>
                        ) : (
                          `No Reel (URL: ${reel.videoUrl ?? "undefined"})`
                        )}
                      </td>
                      <td className="p-4">
                        {reel.publishedUrl ? (
                          <a
                            href={reel.publishedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            View Published
                          </a>
                        ) : (
                          "Not Published"
                        )}
                      </td>
                      <td className="p-4">{reel.brand?.name || "Unknown"}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            reel.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : reel.status === "APPROVED"
                              ? "bg-green-500/20 text-green-300"
                              : reel.status === "DISAPPROVED"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {reel.status || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4">{reel.views || 0}</td>
                      <td className="p-4">
                        {reel.createdAt
                          ? new Date(reel.createdAt).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="p-4">
                        {reel.status === "APPROVED" && !reel.viewsLocked && (
                          <ViewsUpdateForm reelId={reel.id} initialViews={reel.views} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center">
            <Pagination page={p} count={count} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSocialProfilePage;
