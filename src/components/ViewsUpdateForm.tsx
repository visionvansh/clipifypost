"use client";

import { useState } from "react";

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
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        type="number"
        value={views}
        onChange={(e) => setViews(e.target.value)}
        className="w-24 p-2 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        min="0"
        disabled={loading}
      />
      <button
        type="submit"
        className="py-1 px-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? "Updating..." : "Update"}
      </button>
    </form>
  );
};

export default ViewsUpdateForm;