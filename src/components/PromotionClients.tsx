"use client";

import Image from "next/image";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { motion } from "framer-motion";

// Define the type for company
interface Company {
  id: number;
  name: string;
  image: string;
  description?: string | null;
  rate?: string | null;
  contentLink: string;
  tutorialVideo: string;
  thumbnailUrl: string;
}

interface PromotionsClientProps {
  company: Company;
  companyId: number;
}

// 3D Logo Component
const Logo3D = () => (
  <Canvas className="w-full h-64 sm:h-96">
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} />
    <Text
      position={[0, 0, 0]}
      fontSize={1}
      color="#FFD700"
      anchorX="center"
      anchorY="middle"
    >
      Promotions
    </Text>
    <OrbitControls enableZoom={false} />
  </Canvas>
);

export default function PromotionsClient({ company, companyId }: PromotionsClientProps) {
  return (
    <div className="bg-[#121212] w-full min-h-screen overflow-hidden relative">
      {/* Scrollable Full Page Content */}
      <div className="px-4 sm:px-8 h-full overflow-y-auto text-white pb-32">
        {/* Full Width Company Image with 3D Tilt */}
        <motion.div
          className="relative w-full h-64 sm:h-96 mb-6 rounded-xl overflow-hidden border-2 border-[#FFD700]"
          whileHover={{ rotateX: 5, rotateY: 5 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={company.image}
            alt={company.name}
            layout="fill"
            objectFit="cover"
            className="rounded-xl"
          />
          <div className="absolute inset-0 bg-black opacity-20" />
        </motion.div>

        {/* 3D Logo */}
        <div className="mb-6">
          <Logo3D />
        </div>

        {/* Promotion Details Section */}
        <motion.div
          className="bg-[#1a1a1a] p-6 rounded-xl mb-6 border border-[#FFD700] shadow-lg transform-gpu"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)" }}
        >
          <h2 className="text-2xl font-semibold mb-2 text-[#FFD700] glow-text">📣 Promotion Details</h2>
          <p className="text-gray-300 leading-relaxed text-base">{company.description ?? "No description available"}</p>
        </motion.div>

        {/* Payment Info Section */}
        <motion.div
          className="bg-[#1a1a1a] p-6 rounded-xl mb-6 border-l-4 border-[#FFD700] shadow-lg transform-gpu"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)" }}
        >
          <h2 className="text-xl font-semibold mb-2 text-[#FFD700] glow-text">💵 Payment Details</h2>
          <p className="text-gray-200 text-base">
            You’ll earn <span className="font-bold text-[#FFD700]">${company.rate ?? "N/A"}</span> per 100K views.
          </p>
        </motion.div>

        {/* Content Link Section */}
        <motion.div
          className="bg-[#1a1a1a] p-6 rounded-xl mb-6 border border-[#FFD700] shadow-lg transform-gpu"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)" }}
        >
          <h2 className="text-xl font-semibold mb-2 text-[#FFD700] glow-text">🎬 Download Content</h2>
          <Link href={company.contentLink} target="_blank">
            <motion.div
              className="bg-[#FFD700] text-black px-5 py-2 mt-3 rounded-md text-center cursor-pointer w-fit font-semibold"
              whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(255, 215, 0, 0.8)" }}
              whileTap={{ scale: 0.95 }}
            >
              Open Google Drive 📁
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 w-full bg-[#1a1a1a]/90 backdrop-blur-md py-4 px-4 flex justify-center gap-8 z-10 shadow-lg border-t border-[#FFD700]">
        <Link href={`/list/paste-link/${companyId}/verify`}>
          <motion.div
            className="text-[#FFD700] text-lg font-semibold glow-icon"
            whileHover={{ scale: 1.1, textShadow: "0 0 10px rgba(255, 215, 0, 0.8)" }}
          >
            Verify 🔥
          </motion.div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/paste-links`}>
          <motion.div
            className="text-[#FFD700] text-lg font-semibold glow-icon"
            whileHover={{ scale: 1.1, textShadow: "0 0 10px rgba(255, 215, 0, 0.8)" }}
          >
            Paste Links 📎
          </motion.div>
        </Link>
        <Link href={`/list/paste-link/${companyId}/promotions`}>
          <motion.div
            className="text-[#FFD700] text-lg font-semibold glow-icon"
            whileHover={{ scale: 1.1, textShadow: "0 0 10px rgba(255, 215, 0, 0.8)" }}
          >
            Promotions ✨
          </motion.div>
        </Link>
      </nav>

      {/* Custom CSS */}
      <style jsx global>{`
        .glow-text {
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
        }
        .glow-icon {
          transition: all 0.3s ease;
        }
        .glow-icon:hover {
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
        }
      `}</style>
    </div>
  );
}