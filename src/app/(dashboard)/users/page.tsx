import React from 'react';
import RevenueChart from '@/components/RevenueChart';
import ViewsChart from '@/components/ViewsChart';
import EventCalendarContainer from '@/components/EventCalendarContainer';
import { MdOutlineDashboard } from "react-icons/md";
import Image from 'next/image'; // Import Image component from Next.js

const Manager = ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  return (
    <>
      {/* Dashboard Heading */}
      <div className="ml-2 flex items-center space-x-2">
        <MdOutlineDashboard className="text-5xl text-blue-600" />
        <h1 className="text-4xl font-extrabold tracking-wide text-gray-800 font-[Poppins]">
          DASHBOARD
        </h1>
      </div>

      <h2 className="text-2xl font-bold text-gray-700 mb-4 tracking-wide mt-5">
        🌟 Overview
      </h2>

      <div className="ml-8 mr-5 flex gap-4 justify-between flex-wrap">
        <ViewsChart type="Your View" />
        <RevenueChart type="Your Revenue" />
      </div>

      <div className="p-4 flex gap-4 flex-col xl:flex-row ml-8">
        {/* LEFT */}
        <div className="w-full xl:w-2/3">
          <div className="h-full bg-white p-4 rounded-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              🚀 Path to Success
            </h2>

            <div className="relative flex items-center gap-4 my-4 flex-wrap justify-center">
              {/* Card Section */}
              {/* Card 1 */}
              <div className="relative flex flex-col bg-white shadow-lg border border-slate-200 rounded-lg w-full sm:w-96 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <div className="relative h-56 m-2.5 overflow-hidden text-white rounded-md">
                  <Image
                    src="/success.jpg"
                    alt="card-image"
                    layout="fill" // Ensures the image is responsive
                    objectFit="cover" // Ensures the image covers the area without distortion
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-4 rounded-full bg-cyan-600 py-0.5 px-2.5 border border-transparent text-xs text-white transition-all shadow-sm w-20 text-center">
                    #workhard
                  </div>
                  <h6 className="mb-2 text-slate-800 text-xl font-semibold">
                    🚀 Post Daily & Earn Big! 💰
                  </h6>
                  <p className="text-slate-600 leading-normal font-semibold">
                    Consistency pays off! Just post 9-10 reels a day, and you
                    can earn $20 for every 100K views. 🎯 It’s a golden
                    opportunity to turn your creativity into cash. 🎥✨
                    <br />
                    Edit, post, repeat—and watch your views and earnings
                    skyrocket! 🌟 Don’t wait, start today and grab your share of
                    success! 📈🔥
                  </p>
                </div>
              </div>

              {/* Icon Between Cards */}
          

              {/* Card 2 */}
              <div className="relative flex flex-col bg-white shadow-lg border border-slate-200 rounded-lg w-full sm:w-96 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                <div className="relative h-56 m-2.5 overflow-hidden text-white rounded-md">
                  <Image
                    src="/rich.jpg"
                    alt="millionaire-money-image"
                    layout="fill" // Ensures the image is responsive
                    objectFit="cover" // Ensures the image covers the area without distortion
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <div className="mb-4 rounded-full bg-green-600 py-0.5 px-2.5 border border-transparent text-xs text-white transition-all shadow-sm w-20 text-center">
                    #dreambig
                  </div>
                  <h6 className="mb-2 text-slate-800 text-xl font-semibold">
                    💎 Turn Reels into Riches! 💸
                  </h6>
                  <p className="text-slate-600 leading-normal font-semibold">
                    Did you know posting reels could be your ticket to becoming
                    a millionaire? 💵🔥 With consistent effort and creativity,
                    the numbers add up fast. 🌟📲 <br />
                    Start small, dream big, and let your reels pave the way to
                    financial freedom. 🏆💼 Your millionaire journey starts now!
                    🚀✨
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="w-full xl:w-1/3 flex flex-col gap-8">
          <EventCalendarContainer searchParams={searchParams} />
        </div>
      </div>
    </>
  );
};

export default Manager;
