"use client";

import { useState } from "react";
import { FaEllipsisH } from "react-icons/fa";

type Clip = {
  views: number;
  postedAt: Date | null;
  company: {
    rate: string;
  };
};

type Props = {
  type: string;
  clips: Clip[];
};

const getMonthName = (date: Date) => {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

const RevenueChartClient = ({ type, clips }: Props) => {
  const now = new Date();
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthName(date));
  }

  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthName(now));

  const totalRevenue = clips.reduce((acc, clip) => {
    if (!clip.postedAt) return acc;
    const clipDate = new Date(clip.postedAt);
    const clipMonth = getMonthName(clipDate);
    if (clipMonth !== selectedMonth) return acc;

    const views = clip.views && !isNaN(Number(clip.views)) ? Number(clip.views) : 0;
    const rate = clip.company.rate && !isNaN(Number(clip.company.rate)) ? Number(clip.company.rate) : 0;
    const revenue = (views / 100000) * rate;
    return acc + revenue;
  }, 0);

  const formattedRevenue = `$${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-3 sm:p-4 border-2 border-yellow-500 shadow-xl w-full flex flex-col diamond-clip hover:shadow-2xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-[10px] sm:text-xs bg-black px-2 sm:px-3 py-1 rounded-full text-yellow-400 font-semibold shadow-md hover:bg-gray-800 transition-colors duration-200"
        >
          {months.map((month) => (
            <option key={month} value={month} className="bg-gray-800 text-yellow-400">
              {month}
            </option>
          ))}
        </select>
        <FaEllipsisH className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 cursor-pointer" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold my-2 sm:my-3 text-yellow-600 tracking-wide break-words">
        {formattedRevenue}
      </h1>
      <h2 className="capitalize text-xs sm:text-sm font-medium text-gray-400">
        {type}
      </h2>
    </div>
  );
};

export default RevenueChartClient;