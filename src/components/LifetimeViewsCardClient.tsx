"use client";

import { FaEllipsisH } from "react-icons/fa";

interface LifetimeViewsCardClientProps {
  type: "Lifetime Views";
  totalViews: number;
}

const LifetimeViewsCardClient = ({ type, totalViews }: LifetimeViewsCardClientProps) => {
  const formattedViews = totalViews.toLocaleString("en-US");

  return (
    <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl p-3 sm:p-4 border-2 border-yellow-500 shadow-xl w-full flex flex-col diamond-clip hover:shadow-2xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <span className="text-[10px] sm:text-xs bg-black px-2 sm:px-3 py-1 rounded-full text-yellow-400 font-semibold shadow-md">
          Lifetime
        </span>
        <FaEllipsisH className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 cursor-pointer" />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold my-2 sm:my-3 text-black tracking-wide">
        {formattedViews}
      </h1>
      <h2 className="capitalize text-xs sm:text-sm font-medium text-gray-900">{type}</h2>
    </div>
  );
};

export default LifetimeViewsCardClient;