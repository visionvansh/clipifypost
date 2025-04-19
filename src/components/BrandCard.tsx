"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";

interface BrandCardProps {
  brand: { id: number; name: string };
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="relative">
      <div
        className="backdrop-blur-md bg-black/40 p-6 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/50 transform transition-all hover:scale-105 hover:rotate-3 cursor-pointer perspective-1000"
        onClick={() => setShowForm(true)}
      >
        <h3 className="text-xl font-semibold text-white">{brand.name}</h3>
        <p className="text-gray-400">Click to upload a reel</p>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <UploadForm brandId={brand.id} onClose={() => setShowForm(false)} />
        </div>
      )}
    </div>
  );
};

export default BrandCard;