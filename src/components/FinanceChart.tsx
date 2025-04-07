"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const RevenueChart = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        // Fetch all users' revenue data (no studentId filter for admin)
        const response = await fetch(`/api/revenue-all`);
        const data = await response.json();

        if (!data || data.length === 0) {
          setError("No revenue recorded yet.");
          setLoading(false);
          return;
        }

        // Process data for monthly revenue across all users
        const monthlyData: { [year: string]: { [month: string]: number } } = {};

        data.forEach((record: { revenue: string; createdAt: string }) => {
          const date = new Date(record.createdAt);
          const year = date.getFullYear().toString();
          const month = date.toLocaleString("default", { month: "short" });
          const revenue = parseFloat(record.revenue) || 0;

          if (!monthlyData[year]) monthlyData[year] = {};
          monthlyData[year][month] = (monthlyData[year][month] || 0) + revenue;
        });

        // Set available years for dropdown
        const years = Object.keys(monthlyData).map((year) => parseInt(year)).sort((a, b) => b - a);
        setAvailableYears(years);

        // Monthly Chart Data for selected year
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const selectedYearData = monthlyData[selectedYear] || {};
        const monthlyRevenue = months.map((month) => selectedYearData[month] || 0);

        setChartData({
          labels: months,
          datasets: [
            {
              label: `Monthly Revenue ($) (${selectedYear})`,
              data: monthlyRevenue,
              borderColor: "#FFD700", // Gold Line
              backgroundColor: "rgba(255, 215, 0, 0.2)", // Light gold fill
              borderWidth: 3,
              pointRadius: 5,
              pointBackgroundColor: "#FFD700",
              tension: 0.4,
            },
          ],
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching revenue data:", err);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [selectedYear]);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md w-full">
      <h2 className="text-white text-lg font-semibold mb-4">💰 Monthly Revenue (All Users)</h2>

      {/* Year Selection Dropdown */}
      <div className="mb-6 flex justify-center">
        <div className="relative inline-block w-48">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-yellow-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300 appearance-none cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year} className="bg-gray-800 text-white">
                {year}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg">
          <p className="text-gray-400">{error}</p>
        </div>
      ) : (
        <div>
          <h3 className="text-white text-md mb-2">Monthly Revenue ({selectedYear})</h3>
          <div className="w-full h-[300px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, labels: { color: "#fff" } },
                  tooltip: {
                    callbacks: {
                      label: (context) => `$${context.raw} revenue`,
                    },
                  },
                },
                scales: {
                  x: {
                    grid: { color: "rgba(255,255,255,0.1)" },
                    ticks: { color: "#fff", font: { size: 12 } },
                  },
                  y: {
                    grid: { color: "rgba(255,255,255,0.1)" },
                    ticks: { color: "#fff", font: { size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;