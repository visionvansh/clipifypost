"use client";

import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import UploadForm from "@/components/UploadForm";
import BrandCard from "@/components/BrandCard";
import ViewsUpdateForm from "@/components/ViewsUpdateForm";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Prisma } from "@prisma/client";
import { motion } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import { FaUserClock, FaCheck, FaTimesCircle, FaUpload } from "react-icons/fa";

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
  brandId?: number;
}

const PageLoader = ({ children, isLoading, onComplete }: { children: React.ReactNode; isLoading: boolean; onComplete?: () => void }) => {
  useEffect(() => {
    document.body.style.backgroundColor = "black"; // Ensure black background
    if (isLoading) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2000); // Loading animation duration
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [isLoading, onComplete]);

  return (
    <>
      {isLoading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <motion.div
            className="relative flex items-center justify-center w-64 h-64 rounded-full bg-black border-4 border-yellow-500/50 glow-circle"
            initial={{ scale: 0.5, rotate: 0 }}
            animate={{ scale: 1.2, rotate: 360 }}
            transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          >
            <img
              src="/yellowlogo.png"
              alt="Logo"
              className="w-48 h-48 object-contain glow-logo animate-logo-glow"
            />
          </motion.div>
        </div>
      ) : (
        <div className="bg-black">{children}</div>
      )}
    </>
  );
};

const ClientSideFilter = ({
  searchParams,
  reels,
  count,
  brands,
  page,
  brandId,
}: ClientSideFilterProps) => {
  const router = useRouter();
  const searchParamsState = useSearchParams();
  const [status, setStatus] = useState("ALL");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isCardLoading, setIsCardLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  const isBrandSpecific = brands.length === 1;

  // Row animation for table
  const rowSpring = useSpring({
    from: { opacity: 0, transform: "translateX(-50px)" },
    to: { opacity: 1, transform: "translateX(0)" },
    config: { tension: 200, friction: 20 },
    delay: 100,
  });

  // Header bounce for table
  const headerSpring = useSpring({
    from: { transform: "translateY(0)" },
    to: async (next: (props: { transform: string }) => Promise<void>) => {
      while (true) {
        await next({ transform: "translateY(-5px)" });
        await next({ transform: "translateY(0)" });
      }
    },
    config: { tension: 180, friction: 12 },
  });

  // Icon rotation for table
  const iconSpring = useSpring({
    from: { rotate: 0 },
    to: async (next: (props: { rotate: number }) => Promise<void>) => {
      while (true) {
        await next({ rotate: 10 });
        await next({ rotate: -10 });
        await next({ rotate: 0 });
      }
    },
    config: { tension: 200, friction: 10 },
  });

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
    hover: { scale: 1.05, boxShadow: "0 10px 20px rgba(234, 179, 8, 0.3)", transition: { duration: 0.3 } },
  };

  useEffect(() => {
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
    params.set("page", String(page));
    router.push(`?${params.toString()}`);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    updateSearchParams("status", newStatus);
  };

  const handleBrandClick = (brandId: number) => {
    setIsCardLoading(true);
    setSelectedBrandId(brandId);
  };

  if (!isHydrated) {
    return <div className="text-white bg-black">Loading filters...</div>;
  }

  return (
    <PageLoader isLoading={isCardLoading} onComplete={() => {
      if (selectedBrandId) {
        router.push(`/upload?brandId=${selectedBrandId}`);
      }
    }}>
      <div className="bg-black min-h-screen w-full p-4 sm:p-6 md:p-6 text-white overflow-x-auto">
        <div className="w-full mx-auto space-y-4 sm:space-y-4 md:space-y-6">
          <div className="flex flex-col gap-y-0">
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex items-center justify-between flex-wrap gap-x-4 gap-y-0 sm:gap-y-0"
            >
              <div className="flex items-center space-x-3">
                <FaUpload className="mb-6 md:w-6 md:h-6 text-yellow-500 pulse-animate" />
              <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tight glow-text mb-6">
              Upload Reels
            </h2>
              </div>
            </motion.div>
            {isBrandSpecific && brandId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full p-4 sm:p-6 bg-gradient-to-br from-black to-gray-900 rounded-lg border border-yellow-500 shadow-xl glass-table mt-0"
              >
                <UploadForm brandId={brandId} onClose={() => {}} />
              </motion.div>
            )}
          </div>

          {!isBrandSpecific && (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              <Suspense fallback={<div className="text-white">Loading brands...</div>}>
                {brands.length === 0 ? (
                  <div className="text-white text-center text-lg md:text-xl">
                    No brands available. Please contact support.
                  </div>
                ) : (
                  brands.map((brand: Brand) => (
                    <motion.div
                      key={brand.id}
                      variants={cardVariants}
                      whileHover="hover"
                      onClick={() => handleBrandClick(brand.id)}
                      className="cursor-pointer"
                    >
                      <BrandCard
                        brand={{
                          id: brand.id,
                          name: brand.name,
                          description: brand.description
                            ? brand.description.split(/\./).filter((s: string) => s.trim())
                            : [],
                          rate: brand.rate,
                        }}
                      />
                    </motion.div>
                  ))
                )}
              </Suspense>
            </motion.div>
          )}

          <form className="flex flex-col sm:flex-row gap-4 justify-start max-w-md">
            <div className="w-full sm:w-1/2">
              <label className="block text-sm md:text-base font-medium text-gray-300 mb-2">
                Filter by Status
              </label>
              <select
                name="status"
                value={status}
                onChange={handleStatusChange}
                className="w-full p-2 rounded-lg bg-black border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 glow-input text-sm md:text-base"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DISAPPROVED">Disapproved</option>
              </select>
            </div>
          </form>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full px-2 sm:px-4 max-h-[calc(100vh-200px)] sm:max-h-[calc(100vh-250px)] overflow-y-auto"
          >
            <animated.table style={rowSpring} className="w-full text-left text-sm sm:text-base md:text-lg compact-table glass-table rounded-lg">
              <animated.thead style={headerSpring} className="sticky top-0 bg-gradient-to-r from-black to-gray-800 z-10">
                <tr>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[80px] text-sm md:text-base table-header">Reel</th>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[80px] text-sm md:text-base table-header">Published Link</th>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[80px] text-sm md:text-base table-header">Brand</th>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text text-center min-w-[80px] text-sm md:text-base table-header">Status</th>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text text-right min-w-[60px] text-sm md:text-base table-header">Views</th>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[80px] text-sm md:text-base table-header">Uploaded</th>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[100px] text-sm md:text-base table-header">Disapproval Message</th>
                  <th className="px-2 sm:px-3 py-2 text-yellow-500 animate-glow glow-text text-center min-w-[80px] text-sm md:text-base table-header">Actions</th>
                </tr>
              </animated.thead>
              <tbody>
                {reels.map((reel: FormattedUserReel) => (
                  <animated.tr
                    key={reel.id}
                    style={rowSpring}
                    className="table-row border-b border-gray-700 hover:bg-gray-800 transition-colors duration-300"
                  >
                    <td className="px-2 sm:px-3 py-2 text-white truncate text-sm md:text-base">
                      {reel.videoUrl ? (
                        <a
                          href={reel.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          View Reel
                        </a>
                      ) : (
                        `No Reel (URL: ${reel.videoUrl ?? "undefined"})`
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-white truncate text-sm md:text-base">
                      {reel.publishedUrl ? (
                        <a
                          href={reel.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          View Published
                        </a>
                      ) : (
                        "Not Published"
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-white truncate text-sm md:text-base">{reel.brand?.name || "Unknown"}</td>
                    <td className="px-2 sm:px-3 py-2 flex justify-center">
                      <animated.div style={iconSpring}>
                        {reel.status === "PENDING" ? (
                          <FaUserClock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 pulse-animate" />
                        ) : reel.status === "APPROVED" ? (
                          <FaCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 pulse-animate" />
                        ) : reel.status === "DISAPPROVED" ? (
                          <FaTimesCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 pulse-animate" />
                        ) : (
                          <span className="text-gray-400 text-sm md:text-base">Unknown</span>
                        )}
                      </animated.div>
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-white text-right text-sm md:text-base">{reel.views || 0}</td>
                    <td className="px-2 sm:px-3 py-2 text-white truncate text-sm md:text-base">{reel.formattedCreatedAt}</td>
                    <td className="px-2 sm:px-3 py-2 text-white truncate text-sm md:text-base">
                      {reel.disapprovalMessage ? (
                        <span className="px-2 py-1 rounded-full text-xs sm:text-sm bg-red-600 text-white shadow-md shadow-red-500/20">
                          {reel.disapprovalMessage}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-3 py-2 text-center text-sm md:text-base">
                      {reel.status === "APPROVED" && !reel.viewsLocked && (
                        <Suspense fallback={<div>Loading form...</div>}>
                          <ViewsUpdateForm reelId={reel.id} initialViews={reel.views} />
                        </Suspense>
                      )}
                    </td>
                  </animated.tr>
                ))}
              </tbody>
            </animated.table>
          </motion.div>

          <div className="flex justify-center mt-4 md:mt-6">
            <Suspense fallback={<div>Loading pagination...</div>}>
              <Pagination page={page} count={count} />
            </Suspense>
          </div>
        </div>
      </div>
    </PageLoader>
  );
};

export default ClientSideFilter;