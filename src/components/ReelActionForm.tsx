"use client";

import { useState } from "react";

interface ReelActionFormProps {
  reel: {
    id: number;
    status: string;
    publishedUrl: string | null;
    views: number;
    disapprovalMessage?: string | null;
  };
  setMessage: (message: string | null) => void;
}

const ReelActionForm: React.FC<ReelActionFormProps> = ({ reel: initialReel, setMessage }) => {
  const [reel, setReel] = useState(initialReel);
  const [publishedUrl, setPublishedUrl] = useState(reel.publishedUrl || "");
  const [views, setViews] = useState(reel.views.toString());
  const [loading, setLoading] = useState(false);
  const [showDisapprovalPrompt, setShowDisapprovalPrompt] = useState(false);
  const [disapprovalMessage, setDisapprovalMessage] = useState("");

  const handleAction = async (action: string, extraData: any = {}) => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/reel-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reelId: reel.id,
          action,
          ...extraData,
        }),
      });

      if (response.ok) {
        const updatedReel = await response.json();
        setReel({
          ...reel,
          status: updatedReel.reel.status,
          publishedUrl: updatedReel.reel.publishedUrl,
          views: updatedReel.reel.views,
          disapprovalMessage: updatedReel.reel.disapprovalMessage,
        });
        setPublishedUrl(updatedReel.reel.publishedUrl || "");
        setViews(updatedReel.reel.views.toString());
        setMessage(updatedReel.message);
        setTimeout(() => setMessage(null), 3000);
        setShowDisapprovalPrompt(false);
        setDisapprovalMessage("");
      } else {
        const error = await response.json();
        setMessage(error.error || `Failed to ${action.toLowerCase()} reel`);
      }
    } catch (error) {
      console.error(`${action} error:`, error);
      setMessage(`Failed to ${action.toLowerCase()} reel`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishedUrl) {
      setMessage("Published URL is required for approval");
      return;
    }
    handleAction("APPROVE", { publishedUrl, views: parseInt(views) || 0 });
  };

  const handleDisapprove = () => {
    setShowDisapprovalPrompt(true);
  };

  const submitDisapproval = () => {
    if (!disapprovalMessage.trim()) {
      setMessage("Disapproval reason is required");
      return;
    }
    handleAction("REJECT", { disapprovalMessage });
  };

  const handleUpdateViews = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction("UPDATE_VIEWS", { views: parseInt(views) || 0 });
  };

  const handleUpdatePublishedUrl = (e: React.FormEvent) => {
    e.preventDefault();
    handleAction("UPDATE_URL", { publishedUrl });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpdatePublishedUrl} className="space-y-4">
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
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="py-2 px-4 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Processing..." : "Update URL"}
        </button>
      </form>

      {reel.status === "PENDING" && (
        <form onSubmit={handleApprove} className="space-y-4">
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

      {reel.status !== "DISAPPROVED" && (
        <button
          onClick={handleDisapprove}
          className="py-2 px-4 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Processing..." : "Disapprove"}
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
            className="py-2 px-4 rounded-lg	bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Processing..." : "Update Views"}
          </button>
        </form>
      )}

      {reel.status === "DISAPPROVED" && (
        <form onSubmit={handleApprove} className="space-y-4">
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

      {showDisapprovalPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Disapproval Reason</h3>
            <textarea
              value={disapprovalMessage}
              onChange={(e) => setDisapprovalMessage(e.target.value)}
              placeholder="Enter reason for disapproval"
              className="w-full p-2 rounded-lg bg-gray-800/50 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              rows={4}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDisapprovalPrompt(false)}
                className="py-2 px-4 rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={submitDisapproval}
                className="py-2 px-4 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !disapprovalMessage.trim()}
              >
                {loading ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReelActionForm;