"use client";
import Image from "next/image";

interface LifetimeViewsCardClientProps {
  type: "Lifetime Views";
  totalViews: number;
}

const LifetimeViewsCardClient = ({ type, totalViews }: LifetimeViewsCardClientProps) => {
  const formattedViews = totalViews.toLocaleString("en-US");

  return (
    <div className="bg-gray-900 rounded-xl p-3 sm:p-4 border border-gray-700 shadow-md w-full flex flex-col">
      <div className="flex justify-between items-center">
        <span className="text-[10px] sm:text-xs bg-blue-600 px-2 sm:px-3 py-1 rounded-full text-white font-semibold shadow-md">
          Lifetime
        </span>
        <Image
          src="/more.png"
          alt="More"
          width={16}
          height={16}
          className="opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer sm:w-[20px] sm:h-[20px]"
        />
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold my-2 sm:my-3 text-blue-400 tracking-wide">
        {formattedViews}
      </h1>
      <h2 className="capitalize text-xs sm:text-sm font-medium text-gray-400">{type}</h2>
    </div>
  );
};

export default LifetimeViewsCardClient;