"use client";

import { FaEllipsisH } from "react-icons/fa";

interface LifetimeRevenueCardClientProps {
  type: "Lifetime Revenue";
  totalRevenue: number;
}

const LifetimeRevenueCardClient = ({ type, totalRevenue }: LifetimeRevenueCardClientProps) => {
  const formattedRevenue = totalRevenue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-3 sm:p-4 border-2 border-yellow-500 shadow-xl w-full flex flex-col diamond-clip hover:shadow-2xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <span className="text-[10px] sm:text-xs bg-black px-2 sm:px-3 py-1 rounded-full text-yellow-400 font-semibold shadow-md">
          Lifetime
        </span>
        <FaEllipsisH className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 cursor-pointer" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold my-2 sm:my-3 text-black tracking-wide">
        {formattedRevenue}
      </h1>
      <h2 className="capitalize text-xs sm:text-sm font-medium text-gray-900">{type}</h2>
    </div>
  );
};

export default LifetimeRevenueCardClient;