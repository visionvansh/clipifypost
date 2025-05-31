"use client";
import Link from "next/link";
import { FormEvent, useState, useRef, useEffect } from "react";
import { MdContentPaste, MdList } from "react-icons/md";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ClientAllLinksTable from "@/app/(dashboard)/list/paste-link/[companyId]/all-links/ClientAllLinksTable";

type Account = {
  id: number;
  userId: string;
  instagramLink: string;
  verificationCode: string | null;
  isVerified: boolean;
  status: string;
  driveLink: string | null;
};

type Clip = {
  id: number;
  accountId: number;
  companyId: number;
  link: string;
  views: number;
  previousApprovedViews: number | null;
  status: string;
  postedAt: Date;
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
  const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(reel|p)\/[A-Za-z0-9_-]+(\/)?(\?.*)?$/;
  const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[A-Za-z0-9_-]+(\/|\?.*)?$/;
  const tiktokRegex = /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/\d+(\/|\?.*)?$/;

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

    if (link.includes("instagram.com")) {
      const match = path.match(/\/(reel|p)\/([A-Za-z0-9_-]+)/);
      console.log("Client Instagram match:", match);
      return match ? match[2] : null;
    }

    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      if (path.includes("/watch")) {
        const params = new URLSearchParams(parsedUrl.search);
        const id = params.get("v");
        console.log("Client YouTube watch ID:", id);
        return id || null;
      }
      const match = path.match(/\/(shorts\/)?([A-Za-z0-9_-]+)/);
      console.log("Client YouTube match:", match);
      return match ? match[2] : null;
    }

    if (link.includes("tiktok.com")) {
      const match = path.match(/\/video\/(\d+)/);
      console.log("Client TikTok match:", match);
      return match ? match[1] : null;
    }

    return null;
  } catch (error) {
    console.error("Client error extracting clip ID:", error);
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
  const [anime, setAnime] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setIsClient(true);
    const loadAnime = async () => {
      const animeModule = await import("animejs");
      setAnime(() => animeModule.default);
    };
    loadAnime();
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const link = formData.get("link") as string;

    if (!isValidClipLink(link)) {
      toast.error("Invalid clip link! Please provide a valid Instagram reel, YouTube video, or TikTok clip link.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      setIsLoading(false);
      return;
    }

    const clipId = extractClipId(link);
    if (!clipId) {
      toast.error("Could not extract clip ID from the link!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      setIsLoading(false);
      return;
    }

    const isDuplicate = initialClips.some((clip) => {
      const existingClipId = extractClipId(clip.link);
      return existingClipId === clipId && clip.companyId === companyId;
    });

    if (isDuplicate) {
      toast.error("Duplicate clip detected! This clip has already been submitted for this company.", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      setIsLoading(false);
      return;
    }

    formData.append("companyId", companyId.toString());

    try {
      const { message } = await handleClipSubmit(formData);
      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error: any) {
      toast.error(error.message || "Submission failed!", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full text-gray-200 bg-[#121212]">
      <ToastContainer />
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-15 bg-[#121212]">
        <div className="flex items-center space-x-2 mt-6 mb-4">
          <MdContentPaste className="w-6 h-6 text-yellow-500 glowing-icon moving-icon" />
          <h2 className="text-sm sm:text-xl md:text-xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight text-white font-poppins animate-glow ">
            PASTE YOUR CLIP LINK
          </h2>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>
        <div className="max-w-full">
          <form
            ref={formRef}
            onSubmit={onSubmit}
            className="w-full flex flex-col gap-4 animate-slideIn duration-500 ease-in-out"
          >
            <select
              name="accountId"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
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
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
              required
            />
            <input
              name="views"
              type="number"
              placeholder="Enter Views 👀"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 px-4 sm:p-4 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md text-base font-bold tracking-wide transform hover:scale-105 flex items-center justify-center gap-2 glow-item"
              disabled={isLoading}
            >
              {isLoading ? "Submitting... ⏳" : "Submit 🚀"}
            </button>
          </form>
        </div>
      </div>
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-15 mt-6 bg-[#121212]">
        <div className="overflow-x-auto bg-[#121212] sm:overflow-x-auto">
          <div className="flex items-center space-x-2 mt-6 mb-4">
            <MdList className="text-2xl md:text-3xl text-yellow-500 glow-icon" />
            <h2 className="text-sm sm:text-xl md:text-xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white animate-glow font-poppins">
              Your Submitted Clips
            </h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>
          <ClientAllLinksTable handleUpdateViews={handleUpdateViews} initialClips={initialClips} />
        </div>
      </div>
    </div>
  );
}