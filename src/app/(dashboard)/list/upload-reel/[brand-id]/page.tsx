"use client";

import { motion } from "framer-motion";
import UploadForm from "@/components/UploadForm";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

// Animation Variants
const formVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

interface UploadReelPageProps {
  params: { brandId: string };
}

// Server-side data fetching
async function fetchBrand(brandId: string) {
  const brand = await prisma.brand.findUnique({
    where: { id: parseInt(brandId) },
    select: { id: true, name: true },
  });
  return brand;
}

export default async function UploadReelPage({ params }: UploadReelPageProps) {
  const brand = await fetchBrand(params.brandId);

  if (!brand) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-lamaSkyLight to-lamaPurpleLight text-gray-800 flex justify-center py-16 px-4 sm:px-6 lg:px-8">
      <motion.div
        variants={formVariants}
        initial="hidden"
        animate="visible"
        className="max-w-md w-full mx-auto space-y-8"
      >
        <h1 className="text-3xl font-bold text-lamaPurple text-center">
          Upload Reel for {brand.name} 🎥
        </h1>
        <UploadForm brandId={brand.id} onClose={() => window.history.back()} />
      </motion.div>
    </div>
  );
}