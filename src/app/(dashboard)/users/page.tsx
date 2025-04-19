import React from "react";
import RevenueChart from "@/components/RevenueChart";
import ViewsChart from "@/components/ViewsChart";
import { MdOutlineDashboard } from "react-icons/md";
import Image from "next/image";
import RevFetch from "@/components/VewChart";
import RevChart from "@/components/RevChart";
import EdiRevenue from "@/components/EdiRevenueCard";
import EdiViews from "@/components/EdiViewsCard";
import LifetimeRevenueCard from "@/components/LifetimeRevenue";
import LifetimeViews from "@/components/lifetimeViews";
import EdiLifetimeViews from "@/components/EdiLifetimeViews"
import EdiLifetimeRevenue from "@/components/EdiLifetimeRevenue"
import EdiViewsChart from "@/components/EdiViewsChart"
import EdiRevenueChart from "@/components/EdiRevenueChart"


const Users = ({ searchParams }: { searchParams: { [keys: string]: string | undefined } }) => {
  return (
    <div className="bg-black min-h-screen w-full flex flex-col p-4 md:p-6 text-white overflow-y-auto">
      {/* Dashboard Heading */}
      <div className="flex items-center space-x-2 md:space-x-3">
        <MdOutlineDashboard className="text-4xl md:text-5xl text-yellow-500" />
        <h1 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight transform rotate-3d">
              DASHBOARD  
            </h1>
      </div>

      {/* Overview Heading */}
      <h2 className="text-xl md:text-2xl font-extrabold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-purple-600 tracking-tight transform rotate-3d mt-4 md:mt-6 mb-3 md:mb-4">
  <span className="text-black dark:text-white mr-2">📤</span>
  UPLOADERS OVERVIEW  
</h2>


     
      {/* Overview Cards */}
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

      {/* Editors Overview Heading */}
      <h2 className="text-xl md:text-2xl font-extrabold font-poppins bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-purple-600 tracking-tight transform rotate-3d mt-4 md:mt-6 mb-3 md:mb-4">
  <span className="text-black dark:text-white mr-2">✏️ </span>
  EDITORS OVERVIEW  
  
</h2>

      {/* Editors Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
        <EdiViews type="Your Views" />
        <EdiRevenue type="Your Revenue" />
        <EdiLifetimeViews type="Lifetime Views"/>
        <EdiLifetimeRevenue type="Lifetime Revenue"/>
      </div>

       {/* Graphs Row (RevFetch & RevChart) */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full mt-4 md:mt-6">
        <EdiViewsChart type="Monthly Views" />
        <EdiRevenueChart type="Monthly Revenue" />
        
      </div>
    </div>
  );
};

export default Users;
