import React from "react";
import RevenueChart from "@/components/RevenueChart";
import ViewsChart from "@/components/ViewsChart";
import { MdOutlineDashboard } from "react-icons/md";
import Image from "next/image";
import RevFetch from "@/components/VewChart";
import RevChart from "@/components/RevChart";
import LifetimeRevenueCard from "@/components/LifetimeRevenue";
import LifetimeViews from "@/components/lifetimeViews";

const Users = ({ searchParams }: { searchParams: { [keys: string]: string | undefined } }) => {
  return (
    <div className="bg-black min-h-screen w-full flex flex-col p-4 md:p-6 text-white overflow-y-auto">
      {/* Dashboard Heading */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <MdOutlineDashboard className="text-4xl md:text-5xl text-yellow-500" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide font-[Poppins]">DASHBOARD</h1>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-gray-300 mt-4 md:mt-6 mb-3 md:mb-4 tracking-wide">
        🌟 Overview
      </h2>

      {/* Cards Row (ViewsChart, RevenueChart, LifetimeRevenueCard, LifetimeViews) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        <ViewsChart type="Your View" />
        <RevenueChart type="Your Revenue" />
        <LifetimeRevenueCard />
        <LifetimeViews />
      </div>

      {/* Graphs Row (RevFetch & RevChart) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full mt-4 md:mt-6">
        <RevFetch />
        <RevChart />
      </div>

      {/* Motivational Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 md:mt-8">
        <MotivationCard
          image="/success.jpg"
          tag="#workhard"
          title="🚀 Post Daily & Earn Big! 💰"
          description="Success isn’t just about talent; it’s about consistency. If you’re willing to put in the effort every single day, you’ll see incredible results. Post 9-10 reels daily and watch your numbers grow! The key is persistence—every piece of content you create gets you one step closer to your goals. Keep pushing, keep grinding, and the rewards will come! 📈🔥"
          tagColor="bg-cyan-600"
        />

        <MotivationCard
          image="/rich.jpg"
          tag="#dreambig"
          title="💎 Turn Reels into Riches! 💸"
          description="Every millionaire was once a beginner. The difference between success and failure is action. Start creating, keep posting, and stay consistent! The online world is full of opportunities, and social media is your stage. Don’t wait for the perfect moment—start now. The content you post today could be the foundation of your financial freedom tomorrow! 🚀✨"
          tagColor="bg-green-600"
        />

        <MotivationCard
          image="/hustle.jpg"
          tag="#hustle"
          title="🔥 Stay Focused, Stay Grinding!"
          description="Greatness isn’t built overnight—it’s a daily hustle. The most successful people in the world aren’t the ones who wait for opportunities, but the ones who create them. Hustle every day, push past your limits, and never settle. The grind is tough, but the rewards are worth it. If you want a life others dream about, you need to work while they sleep! 💯"
          tagColor="bg-red-600"
        />

        <MotivationCard
          image="/consistency.webp"
          tag="#consistency"
          title="📅 Consistency is Key!"
          description="Success is not a one-time event; it’s a daily habit. The most powerful thing you can do is show up every single day, even when you don’t feel like it. Whether it's content creation, business, or self-improvement, consistency beats talent when talent doesn’t work hard. Stay patient, stay disciplined, and keep moving forward—your future self will thank you! 🚀"
          tagColor="bg-purple-600"
        />
      </div>
    </div>
  );
};

// Reusable Motivation Card Component
const MotivationCard = ({ image, tag, title, description, tagColor }: any) => {
  return (
    <div className="relative flex flex-col bg-gray-900 shadow-lg border border-gray-700 rounded-lg w-full sm:w-auto hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="relative h-40 md:h-56 m-3 overflow-hidden rounded-md">
        <Image
          src={image}
          alt={title}
          layout="fill"
          objectFit="cover"
          className="group-hover:scale-110 transition-transform duration-300"
        />
      </div>
      <div className="p-3 md:p-4">
        <div className={`mb-2 md:mb-3 ${tagColor} py-1 px-2 md:px-3 rounded-full text-xs text-white text-center w-20 md:w-24`}>
          {tag}
        </div>
        <h6 className="text-md md:text-lg font-semibold text-white">{title}</h6>
        <p className="text-gray-400 text-sm md:text-base leading-normal font-medium">{description}</p>
      </div>
    </div>
  );
};

export default Users;
