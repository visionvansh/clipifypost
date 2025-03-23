import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import AttendanceChartContainer from "@/components/AttendenceChartContainer";
import { FaUserShield } from "react-icons/fa"; // Importing Admin Icon

const AdminPage = () => {
  return (
    <div className="p-4 flex flex-col gap-6 bg-black text-white min-h-screen">
      {/* 🔹 Admin Page Heading - Removed Greyish BG */}
      <div className="flex items-center gap-3 text-white text-3xl font-extrabold p-4 rounded-lg">
        <FaUserShield className="text-blue-500 text-4xl" /> {/* Admin Icon */}
        <h1 className="tracking-wide">Admin Dashboard</h1>
      </div>

      {/* 🔹 User Cards - Now in one row */}
      <div className="flex gap-4 justify-between">
        <UserCard type="admin" />
        <UserCard type="manager" />
        <UserCard type="user" />
        <UserCard type="newUser" />
      </div>

      {/* 🔹 Charts Section - Attendance & Finance in One Line */}
      <div className="flex gap-4">
        {/* Attendance Chart */}
        <div className="w-1/2 h-[450px] bg-gray-900 p-4 rounded-lg">
          <AttendanceChartContainer />
        </div>

        {/* Finance Chart */}
        <div className="w-1/2 h-[450px] bg-gray-900 p-4 rounded-lg">
          <FinanceChart />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
