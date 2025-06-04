import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { Prisma } from "@prisma/client";
import ClientSideFilter from "@/components/ClientSideFilter";

type UserReelWithBrand = Prisma.UserReelGetPayload<{
  include: { brand: { select: { name: true } } };
}>;

type FormattedUserReel = UserReelWithBrand & { formattedCreatedAt: string };

interface BrandPageProps {
  params: Promise<{ brandId: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

const BrandPage = async ({ params, searchParams }: BrandPageProps) => {
  const { userId } = await auth();
  if (!userId) {
    return <div className="text-white text-center mt-10 text-xl">Please log in to view this page.</div>;
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const brandId = parseInt(resolvedParams.brandId);
  const { page, status, search } = resolvedSearchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.UserReelWhereInput = {
    studentId: userId,
    brandId: brandId,
  };

  if (search) {
    query.videoUrl = { contains: search, mode: "insensitive" };
  }

  if (status && status !== "ALL") {
    query.status = status as "PENDING" | "APPROVED" | "DISAPPROVED";
  }

  try {
    const [reels, count, brand] = await prisma.$transaction([
      prisma.userReel.findMany({
        where: query,
        include: { brand: { select: { name: true } } },
        take: ITEM_PER_PAGE,
        skip: ITEM_PER_PAGE * (p - 1),
      }),
      prisma.userReel.count({ where: query }),
      prisma.brand.findUnique({
        where: { id: brandId },
        select: { id: true, name: true, description: true, rate: true },
      }),
    ]);

    if (!brand) {
      return <div className="text-white text-center mt-10 text-xl">Brand not found</div>;
    }

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
      <ClientSideFilter
        searchParams={resolvedSearchParams}
        reels={formattedReels}
        count={count}
        brands={[brand]}
        page={p}
        brandId={brandId}
      />
    );
  } catch (error) {
    console.error("Error fetching brand data:", error);
    return <div className="text-white text-center mt-10 text-xl">Error loading brand data. Please try again.</div>;
  }
};

export default BrandPage;