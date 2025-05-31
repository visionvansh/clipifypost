"use client";

import { FormEvent, useState, useEffect } from "react";
import { MdAccountCircle, MdLink, MdCalendarToday, MdVisibility, MdCheckCircle, MdBuild, MdList } from "react-icons/md";
import { FaCheck, FaTimes, FaHourglassHalf } from "react-icons/fa";

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
    return parsedUrl.pathname.split("/")[1] || url;
  } catch {
    return url;
  }
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (successMessage) {
      timeoutId = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [successMessage]);

  const [anime, setAnime] = useState<any>(null);

  useEffect(() => {
    const loadAnime = async () => {
      const animeModule = await import("animejs");
      setAnime(() => animeModule.default);
    };
    loadAnime();
  }, []);

  useEffect(() => {
    if (anime && clips && clips.length > 0) {
      anime({
        targets: ".table-row",
        translateX: [-100, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: "easeOutQuad",
      });

      const pendingStatuses = document.querySelectorAll(".pending-status");
      anime({
        targets: pendingStatuses,
        textShadow: [
          { value: "0 0 5px rgba(234, 179, 8, 0.8)" },
          { value: "0 0 10px rgba(234, 179, 8, 1)" },
          { value: "0 0 5px rgba(234, 179, 8, 0.8)" },
        ],
        loop: true,
        duration: 1500,
        easing: "linear",
      });

      const rows = document.querySelectorAll(".table-row");
      rows.forEach((row) => {
        row.addEventListener("mouseenter", () => {
          anime({
            targets: row,
            scale: 1.005,
            duration: 300,
            easing: "easeOutQuad",
          });
        });
        row.addEventListener("mouseleave", () => {
          anime({
            targets: row,
            scale: 1,
            duration: 300,
            easing: "easeOutQuad",
          });
        });
      });
    }
  }, [anime, clips]);

  const onUpdateViews = async (e: FormEvent<HTMLFormElement>, clipId: number) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const { message, clip: updatedClip } = await handleUpdateViews(formData);
      setClips((prev) => [
        updatedClip,
        ...prev.filter((clip) => clip.id !== clipId),
      ]);
      setSuccessMessage(message);
    } catch (error: any) {
      console.error("Update failed:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-black to-gray-900 rounded-lg p-4 md:p-6 border border-yellow-500 shadow-xl hover:shadow-2xl transition-all duration-300" style={{ boxShadow: "0 0 15px rgba(234, 179, 8, 0.3)" }}>

      {successMessage && (
        <div className="mb-6 p-4 bg-gray-800 text-green-400 border border-gray-600 rounded-md animate-glow">
          <p className="text-lg font-semibold">{successMessage} ✅</p>
        </div>
      )}

      {clips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm md:text-base text-gray-400 font-poppins">No clips submitted yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm glass-table rounded-lg">
            <thead className="sticky top-0 bg-gradient-to-r from-black to-gray-800 z-10">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm">
                  <MdAccountCircle className="inline-block mr-1 glow-icon" /> Account
                </th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm">
                  <MdLink className="inline-block mr-1 glow-icon" /> Link
                </th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm">
                  <MdCalendarToday className="inline-block mr-1 glow-icon" /> Posted At
                </th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm">
                  <MdVisibility className="inline-block mr-1 glow-icon" /> Views
                </th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm">
                  <MdCheckCircle className="inline-block mr-1 glow-icon" /> Status
                </th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[100px] sm:min-w-[150px] text-xs sm:text-sm">
                  <MdBuild className="inline-block mr-1 glow-icon" /> Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {clips.map((clip) => (
                <tr
                  key={clip.id}
                  className="table-row border-b border-gray-700 hover:bg-gray-800 transition-colors duration-300"
                >
                  <td className="px-2 sm:px-4 py-2 text-white truncate">{extractUsername(clip.account.instagramLink)}</td>
                  <td className="px-2 sm:px-4 py-2 text-white break-words">
                    <a
                      href={clip.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                    >
                      {clip.link}
                    </a>
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-white">{formatDate(clip.postedAt)}</td>
                  <td className="px-2 sm:px-4 py-2 text-white">{clip.views}</td>
                  <td className="px-2 sm:px-4 py-2 text-white font-medium capitalize flex items-center gap-2">
                    <span className={clip.status === "pending" ? "pending-status" : ""}>
                      {clip.status}
                    </span>
                    {clip.status.toLowerCase() === "approved" && (
                      <FaCheck className="text-green-500 glow-icon-green" />
                    )}
                    {clip.status.toLowerCase() === "disapproved" && (
                      <FaTimes className="text-red-500 glow-icon-red" />
                    )}
                    {clip.status.toLowerCase() === "pending" && (
                      <FaHourglassHalf className="text-yellow-500 glow-icon" />
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-2">
                    <form onSubmit={(e) => onUpdateViews(e, clip.id)} className="flex items-center gap-3">
                      <input name="clipId" type="hidden" value={clip.id} />
                      <input
                        name="views"
                        type="number"
                        defaultValue={clip.views}
                        className="w-16 sm:w-20 px-2 sm:px-3 py-1 sm:py-2 bg-[#2a2a2a] text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-400 text-xs sm:text-sm"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 sm:px-5 py-1 sm:py-2 bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_10px_rgba(234,179,8,0.8)] transition-all duration-200 shadow-lg transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 text-xs sm:text-sm"
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
      )}
    </div>
  );
}