"use client";
import { useState } from "react";

interface UserRevenueData {
  userId: string;
  username: string;
  reels: { views: number; createdAt: Date; status: string; brand: { rate: number } }[];
}

interface AllUsersRevenueTableClientProps {
  usersRevenueData: UserRevenueData[];
}

const AllUsersRevenueTableClient = ({ usersRevenueData }: AllUsersRevenueTableClientProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    return date.toISOString().slice(0, 7);
  });

  // Calculate views for a user for the selected month (matches ViewsChartClient)
  const calculateViews = (reels: UserRevenueData["reels"]) => {
    const filteredReels = reels.filter((reel) => reel.createdAt.toISOString().slice(0, 7) === selectedMonth);
    console.log(`Filtered Reels for ${selectedMonth}:`, filteredReels);
    return filteredReels.reduce((acc, reel) => acc + (reel.views || 0), 0);
  };

  // Calculate revenue for a user for the selected month (matches RevenueChartClient)
  const calculateRevenue = (reels: UserRevenueData["reels"]) => {
    const filteredReels = reels.filter((reel) => reel.createdAt.toISOString().slice(0, 7) === selectedMonth);
    return filteredReels.reduce((acc, reel) => {
      const viewsValue = reel.views || 0;
      const rate = reel.brand?.rate || 0;
      return acc + (viewsValue / 100000) * rate;
    }, 0);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Admin: Users Revenue and Views</h1>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-sm bg-blue-600 px-4 py-2 rounded-full text-white font-semibold shadow-md"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {new Date(month).toLocaleString("en-US", { month: "long", year: "numeric" })}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-900 border border-gray-700 rounded-xl shadow-md">
          <thead>
            <tr className="bg-gray-800">
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Username</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Views</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-white">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {usersRevenueData.map((user) => {
              const totalViews = calculateViews(user.reels);
              const totalRevenue = calculateRevenue(user.reels);
              const formattedViews = totalViews.toLocaleString("en-US");
              const formattedRevenue = totalRevenue.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              });

              console.log(`User: ${user.username}, Month: ${selectedMonth}, Views: ${totalViews}, Revenue: ${totalRevenue}`);

              return (
                <tr key={user.userId} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="px-6 py-4 text-sm text-gray-300">{user.username}</td>
                  <td className="px-6 py-4 text-sm text-blue-400">{formattedViews}</td>
                  <td className="px-6 py-4 text-sm text-green-400">{formattedRevenue}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllUsersRevenueTableClient;
