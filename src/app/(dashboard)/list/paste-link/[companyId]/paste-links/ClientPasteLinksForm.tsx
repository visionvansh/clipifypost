"use client";
import Link from "next/link";
import { FormEvent, useState, useRef } from "react";

type Account = {
  id: number;
  instagramLink: string;
  isVerified: boolean;
  status: string;
};

type Clip = {
  id: number;
  accountId: number;
  companyId: number;
  link: string;
  views: number;
  previousApprovedViews: number | null;
  status: string;
  account: Account;
};

const extractUsername = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const username = path.split("/")[1];
    return username || url;
  } catch {
    return url;
  }
};

const isValidClipLink = (link: string): boolean => {
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+(\/|\?.*)?$/;
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+(\/|\?.*)?$/;
  const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+(\/|\?.*)?$/;
  
  // Debugging log (remove in production)
  console.log("Client validating link:", link, {
    instagram: instagramRegex.test(link),
    youtube: youtubeRegex.test(link),
    tiktok: tiktokRegex.test(link),
  });
  
  return instagramRegex.test(link) || youtubeRegex.test(link) || tiktokRegex.test(link);
};

const extractClipId = (link: string): string | null => {
  try {
    const parsedUrl = new URL(link);
    const path = parsedUrl.pathname;

    // Instagram: /reel/DImfF7qB_gb/ or /p/DImfF7qB_gb/
    if (link.includes("instagram.com")) {
      const match = path.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
      console.log("Client Instagram match:", match); // Debugging log
      return match ? match[2] : null;
    }

    // YouTube: /watch?v=dQw4w9WgXcQ, /shorts/dQw4w9WgXcQ, youtu.be/dQw4w9WgXcQ
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      if (path.includes("/watch")) {
        const params = new URLSearchParams(parsedUrl.search);
        const id = params.get("v");
        console.log("Client YouTube watch ID:", id); // Debugging log
        return id || null;
      }
      const match = path.match(/\/(shorts\/)?([A-Za-z0-9_-]+)/);
      console.log("Client YouTube match:", match); // Debugging log
      return match ? match[2] : null;
    }

    // TikTok: /@username/video/1234567890123456789
    if (link.includes("tiktok.com")) {
      const match = path.match(/\/video\/(\d+)/);
      console.log("Client TikTok match:", match); // Debugging log
      return match ? match[1] : null;
    }

    return null;
  } catch (error) {
    console.error("Client error extracting clip ID:", error); // Debugging log
    return null;
  }
};

export default function ClientPasteLinksForm({
  handleClipSubmit,
  handleUpdateViews,
  initialAccounts,
  companyId,
  initialClips,
}: {
  handleClipSubmit: (formData: FormData) => Promise<{ message: string; clip: Clip }>;
  handleUpdateViews: (formData: FormData) => Promise<{ message: string; clip: Clip }>;
  initialAccounts: Account[];
  companyId: number;
  initialClips: Clip[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [clips, setClips] = useState<Clip[]>(initialClips.slice(0, 2));
  const formRef = useRef<HTMLFormElement>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const link = formData.get("link") as string;

    if (!isValidClipLink(link)) {
      window.alert("Invalid clip link! Please provide a valid Instagram reel, YouTube video, or TikTok clip link.");
      setIsLoading(false);
      return;
    }

    const clipId = extractClipId(link);
    if (!clipId) {
      window.alert("Could not extract clip ID from the link!");
      setIsLoading(false);
      return;
    }

    const isDuplicate = clips.some(
      (clip) => {
        const existingClipId = extractClipId(clip.link);
        return existingClipId === clipId && clip.companyId === companyId;
      }
    );
    if (isDuplicate) {
      window.alert("Duplicate clip detected! This clip has already been submitted for this company.");
      setIsLoading(false);
      return;
    }

    formData.append("companyId", companyId.toString());

    try {
      const { message, clip } = await handleClipSubmit(formData);
      setClips((prev) => [clip, ...prev.slice(0, 1)]);
      window.alert(message);
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error: any) {
      window.alert(error.message || "Submission failed!");
    } finally {
      setIsLoading(false);
    }
  };

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
      window.alert(message);
    } catch (error: any) {
      window.alert("Update failed!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full text-gray-200 bg-black p-2 rounded-md">
      <form ref={formRef} onSubmit={onSubmit} className="w-full flex flex-col gap-2">
        <select
          name="accountId"
          className="w-full p-1.5 bg-[#1a1a1a] text-gray-200 border border-[#333333] rounded-md focus:outline-none focus:border-green-600 transition-all shadow-sm text-sm"
          required
        >
          <option value="">Select Account 📲</option>
          {initialAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {extractUsername(account.instagramLink)}
            </option>
          ))}
        </select>
        <input
          name="link"
          placeholder="Paste Your Clip Link Here 📎"
          className="w-full p-1.5 bg-[#1a1a1a] text-gray-200 border border-[#333333] rounded-md focus:outline-none focus:border-green-600 transition-all shadow-sm text-sm"
          required
        />
        <input
          name="views"
          type="number"
          placeholder="Enter Views 👀"
          className="w-full p-1.5 bg-[#1a1a1a] text-gray-200 border border-[#333333] rounded-md focus:outline-none focus:border-green-600 transition-all shadow-sm text-sm"
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-700 to-green-900 text-white p-1.5 rounded-md hover:from-green-800 hover:to-green-950 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md text-sm font-semibold tracking-wide"
          disabled={isLoading}
        >
          {isLoading ? "Submitting... ⏳" : "Submit 🚀"}
        </button>
      </form>

      <h3 className="text-base font-bold text-white mb-2 mt-4 tracking-tight">Submitted Clips 📋</h3>
      {clips.length === 0 ? (
        <p className="text-gray-400 text-xs">No clips submitted yet. 😢</p>
      ) : (
        <ul className="w-full space-y-2">
          {clips.map((clip) => (
            <li
              key={clip.id}
              className={`w-full p-2 rounded-md border border-[#333333] shadow-sm bg-[#1a1a1a] text-gray-200 ${
                clip.status === "pending" ? "border-orange-500 bg-orange-500/10" : ""
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs text-blue-400">
                    {extractUsername(clip.account.instagramLink)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {clip.status} {clip.status === "pending" ? "⏳" : "✅"}
                  </span>
                </div>
                <a
                  href={clip.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-400 hover:underline truncate"
                >
                  {clip.link}
                </a>
                <form onSubmit={(e) => onUpdateViews(e, clip.id)} className="flex gap-1 items-center">
                  <input name="clipId" type="hidden" value={clip.id} />
                  <input
                    name="views"
                    type="number"
                    defaultValue={clip.views}
                    className="w-16 p-1 bg-[#1a1a1a] text-gray-200 border border-[#333333] rounded-md focus:outline-none focus:border-green-600 transition-all shadow-sm text-xs"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-orange-600 to-orange-800 text-white px-2 py-1 rounded-md hover:from-orange-700 hover:to-orange-900 transition-all shadow-md text-xs font-semibold"
                    disabled={isLoading}
                  >
                    Update 👀
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      {initialClips.length > 2 && (
        <div className="mt-3 flex justify-center">
          <Link href={`/list/paste-link/${companyId}/all-links`}>
            <button className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-full hover:from-blue-600 hover:to-blue-800 text-base font-medium shadow-md">
              See Your Links 🔗
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}