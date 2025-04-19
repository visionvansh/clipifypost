"use client";

import { FormEvent, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type Account = {
  id: number;
  instagramLink: string;
  isVerified: boolean;
  status: string;
  verificationCode?: string;
};

export default function ClientVerifyForm({
  handleAccountSubmit,
  handleVerify,
  initialAccounts,
}: {
  handleAccountSubmit: (formData: FormData) => Promise<string>;
  handleVerify: (formData: FormData) => Promise<string>;
  initialAccounts: Account[];
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [verificationCode, setVerificationCode] = useState<string | null>(null); // Track verification code

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

  const handleCopyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode).then(() => {
        toast.success("Code copied to clipboard!", {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
      }).catch((err) => {
        toast.error("Failed to copy code", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "dark",
        });
      });
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const code = await handleAccountSubmit(formData);
      const instagramLink = formData.get("instagramLink") as string;
      setAccounts((prev) => [
        { id: prev.length + 1, instagramLink, isVerified: false, status: "Awaiting Bio Update", verificationCode: code },
        ...prev,
      ]);
      setVerificationCode(code); // Set the verification code
      if (e.currentTarget) {
        e.currentTarget.reset(); // Null check before reset
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

    try {
      const status = await handleVerify(formData);
      const instagramLink = formData.get("instagramLink") as string;
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.instagramLink === instagramLink ? { ...acc, status } : acc
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
        e.currentTarget.reset(); // Null check before reset
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

  return (
    <div className="w-full text-gray-200">
      {/* Toastify Container */}
      <ToastContainer />
      {/* Submit Form */}
      <form onSubmit={onSubmit} className="w-full flex flex-col gap-2 sm:gap-3">
        <input
          name="instagramLink"
          placeholder="Paste Instagram, YouTube, or TikTok Profile Link 📲"
          className="w-full p-2 sm:p-3 bg-[#1a1a1a] text-gray-200 border border-[#333333] rounded-lg focus:outline-none focus:border-blue-600 transition-all shadow-sm text-xs sm:text-sm"
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-700 to-blue-900 text-white p-2 sm:p-3 rounded-lg hover:from-blue-800 hover:to-blue-950 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg text-sm sm:text-base font-bold tracking-wide transform hover:scale-105 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? "Submitting... ⏳" : "Submit for Verification 🚀"}
        </button>
        {verificationCode && (
          <div className="mt-3 flex flex-col items-center">
            <p className="text-xs sm:text-sm text-gray-400 mb-2">Paste code in bio for verification</p>
            <div className="flex items-center gap-2">
              <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-2 sm:p-3 text-sm sm:text-base font-mono text-green-400">
                {verificationCode}
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-gradient-to-r from-green-700 to-green-900 text-white px-2 sm:px-3 py-1 rounded-lg hover:from-green-800 hover:to-green-950 text-xs sm:text-sm font-semibold transition-all transform hover:scale-105"
              >
                Copy 📋
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Verify Form */}
      <form onSubmit={onVerify} className="w-full flex flex-col gap-2 sm:gap-3 mt-3 sm:mt-4">
        <input
          name="instagramLink"
          placeholder="Paste the same link to verify 📲"
          className="w-full p-2 sm:p-3 bg-[#1a1a1a] text-gray-200 border border-[#333333] rounded-lg focus:outline-none focus:border-green-600 transition-all shadow-sm text-xs sm:text-sm"
          required
        />
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-green-700 to-green-900 text-white p-2 sm:p-3 rounded-lg hover:from-green-800 hover:to-green-950 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg text-sm sm:text-base font-bold tracking-wide transform hover:scale-105 flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? "Verifying... ⏳" : "Verify ✅"}
        </button>
      </form>

      {/* Accounts List */}
      <div className="mt-3 sm:mt-4 w-full">
        <h3 className="text-2xl sm:text-xl font-bold text-white mb-2 sm:mb-3 tracking-tight  bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-600  transform rotate-3d ">Your Accounts <span>📋</span></h3>
        {accounts.length === 0 ? (
          <p className="text-gray-400 text-xs sm:text-sm">No accounts submitted yet. 😢</p>
        ) : (
          <ul className="w-full space-y-2 sm:space-y-3">
            {accounts.map((account) => (
              <li
                key={account.id}
                className={`w-full p-2 sm:p-3 rounded-lg flex justify-between items-center border border-[#333333] shadow-sm ${
                  account.isVerified ? "bg-green-900/20 text-green-400" : "bg-orange-900/20 text-orange-300"
                }`}
              >
                <span className="font-semibold text-xs sm:text-sm truncate">{extractUsername(account.instagramLink)}</span>
                <span className="text-xs">{account.status} {account.isVerified ? "✅" : "⏳"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}