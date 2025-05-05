import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import UploadForm from "@/components/UploadForm";
import BrandCard from "@/components/BrandCard";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { Suspense } from "react";
import ClientSideFilter from "@/components/ClientSideFilter";

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

  const { page, brandId, status, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.UserReelWhereInput = { studentId: userId };

  if (queryParams.search) {
    query.videoUrl = { contains: queryParams.search, mode: "insensitive" };
  }

  if (brandId) {
    query.brandId = parseInt(brandId);
  }

  if (status && status !== "ALL") {
    query.status = status as "PENDING" | "APPROVED" | "DISAPPROVED";
  }

  const [reels, count, brands] = await prisma.$transaction([
    prisma.userReel.findMany({
      where: query,
      include: { brand: { select: { name: true } } },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.userReel.count({ where: query }),
    prisma.brand.findMany({
      select: { id: true, name: true, description: true, rate: true },
    }),
  ]);

  // Format dates on the server to avoid client-side mismatches
  const formattedReels: FormattedUserReel[] = reels.map((reel) => ({
    ...reel,
    formattedCreatedAt: reel.createdAt
      ? new Date(reel.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A",
  }));

  return (
    <Suspense fallback={<div>Loading page...</div>}>
      <ClientSideFilter
        key={`${brandId}-${status}-${p}`}
        searchParams={searchParams}
        reels={formattedReels}
        count={count}
        brands={brands}
        page={p}
      />
    </Suspense>
  );
};

export default AddSocialProfilePage;