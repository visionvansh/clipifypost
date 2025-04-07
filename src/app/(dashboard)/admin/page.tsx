import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import AttendanceChartContainer from "@/components/AttendenceChartContainer";
import { FaUserShield } from "react-icons/fa";

const AdminPage = () => {
  return (
    <div className="bg-black min-h-screen w-full flex flex-col p-4 md:p-6 text-white overflow-y-auto">
      {/* Admin Page Heading */}
      <div className="flex items-center space-x-3">
        <FaUserShield className="text-blue-500 text-4xl md:text-5xl" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-wide font-[Poppins]">
          Admin Dashboard
        </h1>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-gray-300 mt-4 md:mt-6 mb-3 md:mb-4 tracking-wide">
        👥 User Overview
      </h2>

      {/* User Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 w-full">
        <UserCard type="admin" />
        <UserCard type="manager" />
        <UserCard type="user" />
        <UserCard type="newUser" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full mt-4 md:mt-6">
        <div className="bg-gray-900 rounded-lg p-4 ">
          <AttendanceChartContainer />
        </div>
        <div className="bg-gray-900 rounded-lg p-4 ">
          <FinanceChart />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
