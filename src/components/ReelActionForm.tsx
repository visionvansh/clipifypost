"use client";

import { useState } from "react";

interface ReelActionFormProps {
  reel: {
    id: number;
    status: string;
    publishedUrl: string | null;
    views: number;
  };
}

const ReelActionForm: React.FC<ReelActionFormProps> = ({ reel: initialReel }) => {
  const [reel, setReel] = useState(initialReel);
  const [publishedUrl, setPublishedUrl] = useState(reel.publishedUrl || "");
  const [views, setViews] = useState(reel.views.toString());
  const [loading, setLoading] = useState(false);

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/reel-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reelId: reel.id,
          action: "APPROVE",
          publishedUrl,
          views: parseInt(views) || 0,
        }),
      });

      if (response.ok) {
        const updatedReel = await response.json();
        setReel({
          ...reel,
          status: updatedReel.reel.status,
          publishedUrl: updatedReel.reel.publishedUrl,
          views: updatedReel.reel.views,
        });
        setPublishedUrl(updatedReel.reel.publishedUrl || "");
        setViews(updatedReel.reel.views.toString());
      } else {
        alert("Failed to approve reel");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("Failed to approve reel");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/reel-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reelId: reel.id,
          action: "REJECT",
        }),
      });

      if (response.ok) {
        const updatedReel = await response.json();
        setReel({ ...reel, status: updatedReel.reel.status });
      } else {
        alert("Failed to reject reel");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("Failed to reject reel");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateViews = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/reel-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reelId: reel.id,
          action: "UPDATE_VIEWS",
          views: parseInt(views) || 0,
        }),
      });

      if (response.ok) {
        const updatedReel = await response.json();
        setReel({ ...reel, views: updatedReel.reel.views });
        setViews(updatedReel.reel.views.toString());
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
    <div className="space-y-4">
      {reel.status === "PENDING" && (
        <form onSubmit={handleApprove} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Published URL (Instagram/YouTube)
            </label>
            <input
              type="url"
              value={publishedUrl}
              onChange={(e) => setPublishedUrl(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://instagram.com/..."
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Views
            </label>
            <input
              type="number"
              value={views}
              onChange={(e) => setViews(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="py-2 px-4 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Processing..." : "Approve"}
          </button>
        </form>
      )}
      {reel.status === "PENDING" && (
        <button
          onClick={handleReject}
          className="py-2 px-4 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Processing..." : "Reject"}
        </button>
      )}
      {reel.status === "APPROVED" && (
        <form onSubmit={handleUpdateViews} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Views
            </label>
            <input
              type="number"
              value={views}
              onChange={(e) => setViews(e.target.value)}
              className="w-full p-2 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="py-2 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Processing..." : "Update Views"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ReelActionForm;