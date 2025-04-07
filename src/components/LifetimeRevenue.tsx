"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

const LifetimeRevenueCard = () => {
  const { userId } = useAuth();
  const [revenue, setRevenue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchLifetimeRevenue = async () => {
      try {
        const response = await fetch(`/api/revenue?studentId=${userId}`);
        const data = await response.json();

        if (!data || data.length === 0) {
          setError("$0"); // No revenue found, show $0
          setLoading(false);
          return;
        }

        // Calculate total lifetime revenue
        const totalRevenue = data.reduce((sum: number, record: { revenue: string }) => {
          return sum + (parseFloat(record.revenue) || 0);
        }, 0);

        setRevenue(`$${totalRevenue.toLocaleString()}`);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching lifetime revenue:", err);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchLifetimeRevenue();
  }, [userId]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-md w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs bg-yellow-600 px-3 py-1 rounded-full text-white font-semibold shadow-md">
          Lifetime Revenue
        </span>
        <div className="ml-2 sm:ml-4">
          <Image
            src="/more.png"
            alt="More"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          />
        </div>
      </div>

      {/* Revenue Amount */}
      <h1
        className="font-bold my-3 text-yellow-400 tracking-wide sm:text-left text-center"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {loading ? "Loading..." : error ? <span className="text-yellow-400">{error}</span> : revenue}
      </h1>

      <h2 className="capitalize text-sm font-medium text-gray-400 sm:text-left text-center">
        Total Revenue
      </h2>
    </div>
  );
};

export default LifetimeRevenueCard;