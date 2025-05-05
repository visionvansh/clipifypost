"use client";

import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import UploadForm from "@/components/UploadForm";
import BrandCard from "@/components/BrandCard";
import ViewsUpdateForm from "@/components/ViewsUpdateForm";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Prisma } from "@prisma/client";

type UserReelWithBrand = Prisma.UserReelGetPayload<{
  include: { brand: { select: { name: true } } };
}>;

type FormattedUserReel = UserReelWithBrand & { formattedCreatedAt: string };

type Brand = {
  id: number;
  name: string;
  description?: string | null;
  rate: number;
};

interface ClientSideFilterProps {
  searchParams: { [key: string]: string | undefined };
  reels: FormattedUserReel[];
  count: number;
  brands: Brand[];
  page: number;
}

const ClientSideFilter = ({
  searchParams,
  reels,
  count,
  brands,
  page,
}: ClientSideFilterProps) => {
  const router = useRouter();
  const searchParamsState = useSearchParams();
  const [brandId, setBrandId] = useState("");
  const [status, setStatus] = useState("ALL");
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync state with searchParams after hydration
  useEffect(() => {
    setBrandId(searchParams.brandId || "");
    setStatus(searchParams.status || "ALL");
    setIsHydrated(true);
  }, [searchParams]);

  const updateSearchParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParamsState.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // Reset to page 1 on filter change
    router.push(`?${params.toString()}`);
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBrandId = e.target.value;
    setBrandId(newBrandId);
    updateSearchParams("brandId", newBrandId);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    updateSearchParams("status", newStatus);
  };

  // Render nothing or a fallback until hydrated to avoid mismatches
  if (!isHydrated) {
    return <div>Loading filters...</div>;
  }

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white">
        <div className="max-w-7xl w-full mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight transform rotate-3d">
              Upload Your Reel 🎥{" "}
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-600 tracking-tight transform rotate-3d ml-2">
                (For Editors)
              </span>
            </h1>
            <div className="w-full md:w-auto">
              <Suspense fallback={<div>Loading search...</div>}>
                <TableSearch />
              </Suspense>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Suspense fallback={<div>Loading brands...</div>}>
              {brands.map((brand: Brand) => (
                <BrandCard
                  key={brand.id}
                  brand={{
                    id: brand.id,
                    name: brand.name,
                    description: brand.description
                      ? brand.description.split(/\./).filter((s) => s.trim())
                      : [],
                    rate: brand.rate,
                  }}
                />
              ))}
            </Suspense>
          </div>

          <form className="flex flex-col sm:flex-row gap-4 justify-start max-w-md">
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Brand
              </label>
              <select
                name="brandId"
                value={brandId}
                onChange={handleBrandChange}
                className="w-full p-2 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                name="status"
                value={status}
                onChange={handleStatusChange}
                className="w-full p-2 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DISAPPROVED">Disapproved</option>
              </select>
            </div>
          </form>

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
                    <th className="p-4 font-medium">Disapproval Message</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reels.map((reel) => (
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
                      <td className="p-4">{reel.formattedCreatedAt}</td>
                      <td className="p-4">
                        {reel.disapprovalMessage ? (
                          <span className="px-2 py-1 rounded-full text-xs bg-red-600 text-white shadow-md shadow-red-500/20">
                            {reel.disapprovalMessage}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-4">
                        {reel.status === "APPROVED" && !reel.viewsLocked && (
                          <Suspense fallback={<div>Loading form...</div>}>
                            <ViewsUpdateForm
                              reelId={reel.id}
                              initialViews={reel.views}
                            />
                          </Suspense>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center">
            <Suspense fallback={<div>Loading pagination...</div>}>
              <Pagination page={page} count={count} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSideFilter;