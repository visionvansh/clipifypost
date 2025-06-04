"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { MdAttachMoney, MdCloudUpload } from "react-icons/md";

export interface BrandCardProps {
  brand: { id: number; name: string; description: string[]; rate: number };
}

const BrandCard: React.FC<BrandCardProps> = ({ brand }) => {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    if (!isAnimating) {
      setIsAnimating(true);
    }
  };

  return (
    <motion.div
      className="backdrop-blur-md bg-black/40 p-4 sm:p-6 rounded-xl border border-gray-700/50 cursor-pointer w-full border-yellow-500 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={isAnimating ? { scale: 50, opacity: 0, zIndex: 100 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 0 15px rgba(234,179,8,0.5), 0 0 30px rgba(234,179,8,0.3)",
      }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      onAnimationComplete={() => {
        if (isAnimating) {
          router.push(`/list/editors/${brand.id}`);
        }
      }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-4 text-center">
          {brand.name}
        </h3>
        <motion.div
          className="flex items-center justify-center mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          <div className="bg-black bg-opacity-50 p-1.5 rounded-full flex items-center justify-center border border-yellow-500 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all duration-300">
            <p className="text-yellow-500 font-bold glow-text text-sm sm:text-60px text-center">
              ${brand.rate} per 100k views
            </p>
          </div>
        </motion.div>
        {brand.description.length > 0 && (
          <ul className="mb-4 space-y-1">
            {brand.description.map((sentence, index) => (
              <li
                key={index}
                className="text-sm text-white flex items-center"
              >
                <span className="mr-2">→</span>
                <span className="px-2 py-1 rounded-full bg-gray-900 border border-gray-500 hover:bg-yellow-500 hover:text-black transition-all duration-200">
                  {sentence}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center">
          <MdCloudUpload className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 mr-2" />
          <p className="text-yellow-400 font-medium text-sm sm:text-base">Click To Upload Reel</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BrandCard;