"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { FaEllipsisH } from "react-icons/fa";

const LifetimeRevenueCard = () => {
  const { userId } = useAuth();
  const [revenue, setRevenue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRevenue("$0.00");
      setLoading(false);
      return;
    }

    const fetchLifetimeRevenue = async () => {
      try {
        const response = await fetch(`/api/revenue?studentId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch revenue data");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
          setRevenue("$0.00");
          setLoading(false);
          return;
        }

        const totalRevenue = data.reduce((sum: number, record: { revenue: string }) => {
          return sum + (parseFloat(record.revenue) || 0);
        }, 0);

        setRevenue(`$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching lifetime revenue:", err.message);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchLifetimeRevenue();
  }, [userId]);

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-4 border-2 border-yellow-500 shadow-xl w-full flex flex-col hover:scale-105 hover:shadow-2xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <span className="text-xs bg-black px-3 py-1 rounded-full text-white font-semibold shadow-md">
          Lifetime
        </span>
        <FaEllipsisH className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 cursor-pointer" />
      </div>

      <h1
        className="font-bold my-3 text-black tracking-wide sm:text-left text-center"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {loading ? "Loading..." : error ? <span className="text-red-500">{error}</span> : revenue}
      </h1>

      <h2 className="capitalize text-sm font-medium text-gray-900 sm:text-left text-center">
        Lifetime Revenue
      </h2>
    </div>
  );
};

export default LifetimeRevenueCard;