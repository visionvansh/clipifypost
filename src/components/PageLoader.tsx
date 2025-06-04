"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PageLoader = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set black background immediately
    document.body.style.backgroundColor = "black";

    // Simulate loading until all Suspense boundaries resolve
    const timer = setTimeout(() => setLoading(false), 2000); // Minimum loading time
    return () => {
      clearTimeout(timer);
      document.body.style.backgroundColor = "";
    };
  }, []);

  // Force loading state to true on mount to avoid white flash
  useEffect(() => {
    setLoading(true);
  }, []);

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <motion.div
            className="relative flex items-center justify-center w-64 h-64 rounded-full bg-black border-4 border-yellow-500/50 glow-circle"
            initial={{ scale: 0.5, rotate: 0 }}
            animate={{ scale: 1.2, rotate: 360 }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
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

export default PageLoader;