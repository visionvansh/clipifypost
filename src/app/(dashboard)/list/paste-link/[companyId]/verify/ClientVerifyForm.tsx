"use client";

import { FormEvent, useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdLink, MdBarChart } from "react-icons/md";
import AccountsTable from "@/components/AccountsTable";
import { Account } from "@/types/account";

export default function ClientVerifyForm({
  handleAccountSubmit,
  handleVerify,
  handlePasteVerificationCode,
  initialAccounts,
}: {
  handleAccountSubmit: (formData: FormData) => Promise<{ message: string }>;
  handleVerify: (formData: FormData) => Promise<string>;
  handlePasteVerificationCode: (accountId: number) => Promise<{ message: string }>;
  initialAccounts: Account[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [anime, setAnime] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const loadAnime = async () => {
      const animeModule = await import('animejs');
      setAnime(() => animeModule.default);
    };
    loadAnime();
  }, []);

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

  const isValidDriveLink = (link: string): boolean => {
    const driveRegex = /^https?:\/\/(www\.)?(drive\.google\.com)\/(file\/d\/|open\?id=)[a-zA-Z0-9_-]+(\/view)?(\?.*)?$/;
    return driveRegex.test(link);
  };

  const generateTempId = () => {
    return Date.now() + Math.floor(Math.random() * 1000);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const { message } = await handleAccountSubmit(formData);
      const instagramLink = formData.get("instagramLink") as string;
      setAccounts((prev) => [
        {
          id: generateTempId(), // Temporary unique ID
          instagramLink,
          isVerified: false,
          status: "Awaiting Analytics",
          verificationCode: null,
          driveLink: null,
          pushedVerificationCode: null,
        },
        ...prev,
      ]);
      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
    } catch (error: any) {
      if (error.message === "Duplicate Account") {
        toast.error("Duplicate Account", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
      } else {
        toast.error(error.message, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const driveLink = formData.get("driveLink") as string;

    if (!isValidDriveLink(driveLink)) {
      toast.error("Invalid Google Drive link! Please provide a valid Drive link.", {
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

    try {
      const status = await handleVerify(formData);
      const instagramLink = formData.get("instagramLink") as string;
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.instagramLink === instagramLink
            ? {
                ...acc,
                status,
                driveLink,
                pushedVerificationCode: status === "Awaiting Code" ? null : acc.pushedVerificationCode,
              }
            : acc
        )
      );
      toast.success(`Account status updated to: ${status}`, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
      if (e.currentTarget) {
        e.currentTarget.reset();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify account", {
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

  const hasAwaitingAnalyticsAccount = accounts.some((account) => account.status === "Awaiting Analytics");

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full text-gray-200 bg-[#121212]">
      <ToastContainer />
      {/* Social Media Form Section */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-15 bg-[#121212]">
        <div className="flex items-center space-x-2 mt-6 mb-4">
          <MdLink className="w-6 h-6 text-yellow-500 glowing-icon moving-icon" />
          <h2 className="text-sm sm:text-xl md:text-xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white animate-glow font-poppins">
            SUBMIT SOCIAL MEDIA PROFILE
          </h2>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>

        <div className="max-w-full">
          <form onSubmit={onSubmit} className="w-full flex flex-col gap-4 animate-slideIn duration-500 ease-in-out">
            <input
              name="instagramLink"
              placeholder="Paste Instagram, YouTube, or TikTok Profile Link 📲"
              className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 px-4 sm:p-4 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md text-base font-bold tracking-wide transform hover:scale-105 flex items-center justify-center gap-2 glow-item"
              disabled={isLoading}
            >
              {isLoading ? "Submitting... ⏳" : "Submit for Verification 🚀"}
            </button>
          </form>
        </div>
      </div>

      {/* Verification Form Section */}
      {hasAwaitingAnalyticsAccount && (
        <div className="w-full px-4 sm:px-8 md:px-12 lg:px-15 bg-[#121212]">
          <div className="flex items-center space-x-2 mt-6 mb-4">
            <MdBarChart className="w-6 h-6 text-yellow-500 glowing-icon moving-icon" />
            <h2 className="text-sm sm:text-xl md:text-xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white font-poppins">
              SUBMIT ANALYTICS FOR VERIFICATION
            </h2>
          </div>
          <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>
          <div className="max-w-full">
            <form onSubmit={onVerify} className="w-full flex flex-col gap-4 animate-slideIn duration-500 ease-in-out">
              <select
                name="instagramLink"
                className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                required
              >
                <option value="">Select Account 📲</option>
                {accounts
                  .filter((account) => account.status === "Awaiting Analytics")
                  .map((account) => (
                    <option key={account.id} value={account.instagramLink}>
                      {extractUsername(account.instagramLink)}
                    </option>
                  ))}
              </select>
              <input
                name="driveLink"
                placeholder="Paste Google Drive Link for Audience Demographics 📊"
                className="w-full p-3 sm:p-4 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
                required
              />
              <p className="text-xs text-yellow-300 font-semibold mt-1">
                Note: Drive link must have 'Anyone with the link' access, otherwise your account will be rejected.
              </p>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-700 to-green-900 text-white py-2 px-4 sm:p-4 rounded-xl hover:from-green-800 hover:to-green-950 hover:shadow-[0_0_15px_rgba(34,197,94,0.8)] disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-md text-base font-bold tracking-wide transform hover:scale-105 flex items-center justify-center gap-2 glow-item"
                disabled={isLoading}
              >
                {isLoading ? "Verifying... ⏳" : "Verify ✅"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Accounts List Section */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-15 bg-[#121212] overflow-x-auto">
        <div className="flex items-center space-x-2 mt-6 mb-4">
          <MdBarChart className="w-6 h-6 text-yellow-500 glowing-icon moving-icon" />
          <h2 className="text-sm sm:text-xl md:text-xl font-extrabold font-orbitron bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-yellow-500 animate-gradient tracking-tight animate-glow text-white animate-glow font-poppins">
            ALL ACCOUNTS
          </h2>
        </div>
        <div className="w-full h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 mb-4"></div>
        <AccountsTable accounts={accounts} handlePasteVerificationCode={handlePasteVerificationCode} />
      </div>
    </div>
  );
}