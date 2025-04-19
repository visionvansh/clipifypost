"use client";
import Image from "next/image";
import { useState } from "react";

interface RevenueChartClientProps {
  type: "Your Revenue";
  reels: { views: number; createdAt: Date; brand: { rate: number } }[];
}

const RevenueChartClient = ({ type, reels }: RevenueChartClientProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const totalRevenue = reels
    .filter((reel) => reel.createdAt.toISOString().slice(0, 7) === selectedMonth)
    .reduce((acc, reel) => {
      const viewsValue = reel.views || 0;
      const rate = reel.brand.rate || 0;
      return acc + (viewsValue / 100000) * rate;
    }, 0);

  const formattedRevenue = totalRevenue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  return (
    <div className="bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-md w-full flex flex-col">
      <div className="flex justify-between items-center">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-[10px] sm:text-xs bg-blue-600 px-2 sm:px-3 py-1 rounded-full text-white font-semibold shadow-md"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {new Date(month).toLocaleString("en-US", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
        <Image
          src="/more.png"
          alt="More"
          width={16}
          height={16}
          className="opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer sm:w-[20px] sm:h-[20px]"
        />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold my-2 sm:my-3 text-green-400 tracking-wide">
        {formattedRevenue}
      </h1>
      <h2 className="capitalize text-xs sm:text-sm font-medium text-gray-400">{type}</h2>
    </div>
  );
};

export default RevenueChartClient;