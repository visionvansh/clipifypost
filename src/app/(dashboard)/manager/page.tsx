import React from "react";
import RevenueChart from "@/components/RevenueChart";
import ViewsChart from "@/components/ViewsChart";
import { MdOutlineDashboard } from "react-icons/md";
import Image from "next/image";
import RevFetch from "@/components/VewChart";
import RevChart from "@/components/RevChart";
import UserCard from "@/components/UserCard";

export default async function Manager({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const resolvedSearchParams = await searchParams;

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      {/* Single Scrollable Container */}
      <div className="p-6 h-full overflow-y-auto text-white">
        {/* Dashboard Heading */}
        <div className="flex items-center space-x-3">
          <MdOutlineDashboard className="text-5xl text-yellow-500" />
          <h1 className="text-4xl font-extrabold tracking-wide font-[Poppins]">DASHBOARD</h1>
        </div>

        <h2 className="text-2xl font-bold text-gray-300 mt-6 mb-4 tracking-wide">🌟 Overview</h2>

        {/* 🔹 First Row: User Cards & Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UserCard type="user" />
          <UserCard type="newUser" />
          <ViewsChart type="Your View" />
          <RevenueChart type="Your Revenue" />
        </div>

        {/* 🔹 Second Row: RevFetch & RevChart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <RevFetch />
          <RevChart />
        </div>

        {/* 🔹 Third Row: Success & Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Card 1: Success */}
          <div className="relative flex flex-col bg-gray-900 shadow-lg border border-gray-700 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="relative h-56 m-3 overflow-hidden rounded-md">
              <Image
                src="/success.jpg"
                alt="Success Image"
                layout="fill"
                objectFit="cover"
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <div className="mb-3 bg-cyan-600 py-1 px-3 rounded-full text-xs text-white text-center w-24">#workhard</div>
              <h6 className="text-lg font-semibold text-white">🚀 Post Daily & Earn Big! 💰</h6>
              <p className="text-gray-400 leading-normal font-medium">
                Post 9-10 reels a day and earn $20 per 100K views! 🎥✨
                <br />
                Edit, post, repeat—watch your success grow! 📈🔥
              </p>
            </div>
          </div>

          {/* Card 2: Earn */}
          <div className="relative flex flex-col bg-gray-900 shadow-lg border border-gray-700 rounded-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="relative h-56 m-3 overflow-hidden rounded-md">
              <Image
                src="/rich.jpg"
                alt="Millionaire Money"
                layout="fill"
                objectFit="cover"
                className="group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <div className="mb-3 bg-green-600 py-1 px-3 rounded-full text-xs text-white text-center w-24">#dreambig</div>
              <h6 className="text-lg font-semibold text-white">💎 Turn Reels into Riches! 💸</h6>
              <p className="text-gray-400 leading-normal font-medium">
                Posting reels could be your path to wealth! 💵🔥 <br />
                Dream big, stay consistent, and let your content work for you! 🚀✨
              </p>
            </div>
          </div>
        </div>
      </div> {/* End Single Scrollable Container */}
    </div>
  );
}