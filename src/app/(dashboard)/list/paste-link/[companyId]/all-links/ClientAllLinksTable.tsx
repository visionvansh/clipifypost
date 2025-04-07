"use client";
import { FormEvent, useState } from "react";

type Clip = {
  id: number;
  accountId: number;
  link: string;
  views: number;
  previousApprovedViews: number | null; // Added
  status: string;
  account: { instagramLink: string };
};

const extractUsername = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.split("/")[1] || url;
  } catch {
    return url;
  }
};

export default function ClientAllLinksTable({
  handleUpdateViews,
  initialClips,
}: {
  handleUpdateViews: (formData: FormData) => Promise<{ message: string; clip: Clip }>;
  initialClips: Clip[];
}) {
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onUpdateViews = async (e: FormEvent<HTMLFormElement>, clipId: number) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { message, clip: updatedClip } = await handleUpdateViews(formData);
      setClips((prev) => [
        updatedClip,
        ...prev.filter((c) => c.id !== clipId),
      ]);
      setSuccessMessage(message);
    } catch (error: any) {
      console.error("Update failed:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center items-center bg-[#000] overflow-x-hidden">
      <div className="w-full max-w-7xl p-6 rounded-lg bg-[#121212] shadow-lg">
        {successMessage && (
          <div className="mb-6 p-4 bg-[#1f1f1f] text-green-400 border border-gray-600 rounded-md">
            <p className="text-lg font-semibold">{successMessage} ✅</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full rounded-lg overflow-hidden shadow-xl">
            <thead className="bg-gradient-to-r from-[#2a2a2a] to-[#333] text-gray-300 text-lg">
              <tr className="border-b border-gray-700">
                <th className="p-5 text-left">📌 Account</th>
                <th className="p-5 text-left">🔗 Link</th>
                <th className="p-5 text-left">👀 Views</th>
                <th className="p-5 text-left">🚀 Status</th>
                <th className="p-5 text-left">⚡ Actions</th>
              </tr>
            </thead>
            <tbody className="bg-[#1a1a1a] text-gray-200">
              {clips.map((clip) => (
                <tr
                  key={clip.id}
                  className={`border-b border-gray-700 hover:bg-[#222] transition-all duration-300 ${
                    clip.status === "pending" ? "border-orange-500 bg-orange-500/10" : ""
                  }`}
                >
                  <td className="p-5 text-lg">{extractUsername(clip.account.instagramLink)}</td>
                  <td className="p-5">
                    <a
                      href={clip.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-all"
                    >
                      {clip.link}
                    </a>
                  </td>
                  <td className="p-5 text-lg">{clip.views}</td>
                  <td className="p-5 text-lg font-medium capitalize">{clip.status}</td>
                  <td className="p-5">
                    <form onSubmit={(e) => onUpdateViews(e, clip.id)} className="flex items-center gap-3">
                      <input name="clipId" type="hidden" value={clip.id} />
                      <input
                        name="views"
                        type="number"
                        defaultValue={clip.views}
                        className="w-20 px-3 py-2 bg-[#2a2a2a] text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:border-green-400"
                        required
                      />
                      <button
                        type="submit"
                        className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-800 transition-all duration-200"
                        disabled={isLoading}
                      >
                        Update 👀
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}