"use client";

import { useEffect, useState } from "react";
import { MdList } from "react-icons/md";
import { FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import { Account } from "@/types/account";

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

const TickButton = ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded-full transition-all duration-300 ${
      disabled
        ? "bg-gray-600 cursor-not-allowed"
        : "bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)]"
    }`}
  >
    <svg
      className={`w-5 h-5 ${disabled ? "text-gray-400" : "text-black"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  </button>
);

const AccountsTable = ({
  accounts,
  handlePasteVerificationCode,
}: {
  accounts: Account[];
  handlePasteVerificationCode: (accountId: number) => Promise<{ message: string }>;
}) => {
  const [anime, setAnime] = useState<any>(null);
  const [localAccounts, setLocalAccounts] = useState<Account[]>(accounts);

  useEffect(() => {
    const loadAnime = async () => {
      const animeModule = await import("animejs");
      setAnime(() => animeModule.default);
    };
    loadAnime();
  }, []);

  useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    if (anime && localAccounts.length > 0) {
      anime({
        targets: ".table-row",
        translateX: [-100, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: "easeOutQuad",
      });

      const rows = document.querySelectorAll(".table-row");
      rows.forEach((row) => {
        row.addEventListener("mouseenter", () => {
          anime({
            targets: row,
            scale: 1.02,
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
  }, [anime, localAccounts]);

  const handleButtonClick = async (accountId: number) => {
    try {
      const { message } = await handlePasteVerificationCode(accountId);
      setLocalAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, pushedVerificationCode: "Pasted" } : acc
        )
      );
      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to mark verification code as pasted", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-black to-gray-900 rounded-lg p-4 md:p-6 border border-yellow-500 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300" style={{ boxShadow: "0 0 15px rgba(234, 179, 8, 0.6)" }}>
      {localAccounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm text-gray-400 font-orbitron">No accounts submitted yet. 😢</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm glass-table rounded-lg">
            <thead className="sticky top-0 bg-gradient-to-r from-black to-gray-800 z-10">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[150px] text-xs sm:text-sm">Username</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[150px] text-xs sm:text-sm">Status</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text text-center min-w-[100px] text-xs sm:text-sm">Verified</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[150px] text-xs sm:text-sm">Verification Code</th>
                <th className="px-2 sm:px-4 py-2 text-yellow-500 animate-glow glow-text truncate min-w-[150px] text-xs sm:text-sm">Pasted Verification Code</th>
              </tr>
            </thead>
            <tbody>
              {localAccounts.map((account) => (
                <tr key={account.id} className="table-row border-b border-gray-700 hover:bg-gray-800 transition-colors duration-300">
                  <td className="px-2 sm:px-4 py-2 text-white truncate">{extractUsername(account.instagramLink)}</td>
                  <td className="px-2 sm:px-4 py-2 text-white truncate">{account.status}</td>
                  <td className="px-2 sm:px-4 py-2 flex justify-center">
                    {account.isVerified ? <FaCheck className="text-green-500 glow-icon-green" /> : <FaTimes className="text-red-500 glow-icon-red" />}
                  </td>
                  <td className="px-2 sm:px-4 py-2 text-white truncate">{account.verificationCode || "N/A"}</td>
                  <td className="px-2 sm:px-4 py-2 text-white truncate">
                    {(account.status === "Awaiting Code" || account.status === "pending") && !account.pushedVerificationCode ? (
                      <TickButton
                        onClick={() => handleButtonClick(account.id)}
                        disabled={false}
                      />
                    ) : (
                      account.pushedVerificationCode || "None"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AccountsTable;