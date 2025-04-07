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

const ViewsChart = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchViewsData = async () => {
      try {
        // Fetch all users' views data (no studentId filter for admin)
        const response = await fetch(`/api/views-all`);
        const data = await response.json();

        if (!data || data.length === 0) {
          setError("No views recorded yet.");
          setLoading(false);
          return;
        }

        // Process data for monthly views across all users
        const monthlyData: { [year: string]: { [month: string]: number } } = {};

        data.forEach((record: { views: string; createdAt: string }) => {
          const date = new Date(record.createdAt);
          const year = date.getFullYear().toString();
          const month = date.toLocaleString("default", { month: "short" });
          const views = parseInt(record.views) || 0;

          if (!monthlyData[year]) monthlyData[year] = {};
          monthlyData[year][month] = (monthlyData[year][month] || 0) + views;
        });

        // Set available years for dropdown
        const years = Object.keys(monthlyData).map((year) => parseInt(year)).sort((a, b) => b - a);
        setAvailableYears(years);

        // Monthly Chart Data for selected year
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const selectedYearData = monthlyData[selectedYear] || {};
        const monthlyViews = months.map((month) => selectedYearData[month] || 0);

        setChartData({
          labels: months,
          datasets: [
            {
              label: `Total Views (${selectedYear})`,
              data: monthlyViews,
              borderColor: "#ff6b6b", // Red Line
              backgroundColor: "rgba(255, 107, 107, 0.2)", // Light Red Fill
              pointBackgroundColor: "#ff6b6b",
              pointBorderColor: "#fff",
              pointHoverRadius: 6,
              tension: 0.4, // Smooth curve
              borderWidth: 3,
              pointRadius: 5,
            },
          ],
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching views data:", err);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchViewsData();
  }, [selectedYear]);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md w-full">
      <h2 className="text-white text-lg font-semibold mb-4">📈 Monthly Total Views (All Users)</h2>

      {/* Year Selection Dropdown */}
      <div className="mb-6 flex justify-center">
        <div className="relative inline-block w-48">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-300 appearance-none cursor-pointer"
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
          <h3 className="text-white text-md mb-2">Monthly Views ({selectedYear})</h3>
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
                      label: (context) => `${context.raw} views`,
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

export default ViewsChart;