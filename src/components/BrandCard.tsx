"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";

interface BrandCardProps {
  brand: { id: number; name: string; description: string[]; rate: number };
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="relative">
      <div
        className="backdrop-blur-md bg-black/40 p-6 rounded-xl shadow-2xl shadow-black/60 border border-gray-700/50 transform transition-all hover:scale-105 hover:rotate-3 cursor-pointer perspective-1000"
        onClick={() => setShowForm(true)}
      >
        <h3 className="text-2xl font-semibold text-white mb-2">{brand.name}</h3>
        <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-yellow-600 mb-2">
          ${brand.rate} for 100k views
        </p>
        {brand.description.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {brand.description.map((sentence, index) => (
              <div
                key={index}
                className="px-3 py-1 text-sm rounded-full font-medium text-gray-200 bg-gray-900 border border-gray-500 hover:bg-opacity-80 transition-colors duration-200"
              >
                {sentence}
              </div>
            ))}
          </div>
        )}
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