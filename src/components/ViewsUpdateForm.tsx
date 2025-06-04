"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface ViewsUpdateFormProps {
  reelId: number;
  initialViews: number;
}

const ViewsUpdateForm: React.FC<ViewsUpdateFormProps> = ({ reelId, initialViews }) => {
  const [views, setViews] = useState(initialViews.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/user/update-views", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reelId,
          views: parseInt(views) || 0,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Failed to update views");
      }
    } catch (error) {
      console.error("Update views error:", error);
      alert("Failed to update views");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onSubmit={handleSubmit} className="space-y-2">
      <input
        type="number"
        value={views}
        onChange={(e) => setViews(e.target.value)}
        className="w-24 p-2 rounded-lg bg-black border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 glow-input"
        min="0"
        disabled={loading}
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSubmit}
        className="py-1 px-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed glow-button"
        disabled={loading}
      >
        {loading ? "Updating..." : "Update"}
      </motion.button>
    </div>
  );
};

export default ViewsUpdateForm;