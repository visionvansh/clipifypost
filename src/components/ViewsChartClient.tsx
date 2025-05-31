"use client";

import { useState } from "react";
import { FaEllipsisH } from "react-icons/fa";

interface ReelStatus {
  status: string;
  views: number;
  createdAt: Date;
}

interface Reel {
  views: number;
  createdAt: Date;
  reel: ReelStatus[];
}

interface ViewsChartClientProps {
  type: "Your Views";
  reels: Reel[];
}

const ViewsChartClient = ({ type, reels }: ViewsChartClientProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const totalViews = reels
    .filter((reel) => reel.createdAt.toISOString().slice(0, 7) === selectedMonth)
    .reduce((acc, reel) => {
      const latestStatus = reel.reel.length > 0 ? reel.reel[reel.reel.length - 1].status : null;
      if (latestStatus === "APPROVED") {
        return acc + (reel.views || 0);
      }
      return acc;
    }, 0);

  const formattedViews = totalViews.toLocaleString("en-US");

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-3 sm:p-4 border-2 border-yellow-500 shadow-xl w-full flex flex-col diamond-clip hover:shadow-2xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-[10px] sm:text-xs bg-black px-2 sm:px-3 py-1 rounded-full text-yellow-400 font-semibold shadow-md hover:bg-gray-800 transition-colors duration-200"
        >
          {monthOptions.map((month, index) => (
            <option key={`${month}-${index}`} value={month} className="bg-gray-800 text-yellow-400">
              {new Date(month).toLocaleString("en-US", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
        <FaEllipsisH className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 cursor-pointer" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold my-2 sm:my-3 text-yellow-400 tracking-wide">
        {formattedViews}
      </h1>
      <h2 className="capitalize text-xs sm:text-sm font-medium text-gray-400">{type}</h2>
    </div>
  );
};

export default ViewsChartClient;