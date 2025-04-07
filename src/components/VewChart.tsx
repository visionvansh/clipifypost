"use client";

import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useAuth } from "@clerk/nextjs";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ViewsChart = () => {
  const { userId } = useAuth();
  const [monthlyChartData, setMonthlyChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchViewsData = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/views?studentId=${userId}`);
        const data = await response.json();

        if (!data || data.length === 0) {
          setError("No views data found.");
          setLoading(false);
          return;
        }

        // Process data for monthly views
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

        setMonthlyChartData({
          labels: months,
          datasets: [
            {
              label: `Monthly Views (${selectedYear})`,
              data: monthlyViews,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              barThickness: window.innerWidth < 640 ? 12 : 20,
              categoryPercentage: window.innerWidth < 640 ? 0.4 : 0.6,
              barPercentage: window.innerWidth < 640 ? 0.6 : 0.9,
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
  }, [userId, selectedYear]);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(parseInt(event.target.value));
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md w-full">
      <h2 className="text-white text-lg font-semibold mb-4">📊 Views Overview</h2>

      {/* Year Selection Dropdown */}
      <div className="mb-6 flex justify-center">
        <div className="relative inline-block w-48">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-cyan-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-300 appearance-none cursor-pointer"
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
            <Bar
              data={monthlyChartData}
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
                    ticks: {
                      color: "#fff",
                      font: { size: window.innerWidth < 640 ? 10 : 12 },
                      autoSkip: false,
                      maxRotation: window.innerWidth < 640 ? 45 : 0,
                      minRotation: window.innerWidth < 640 ? 45 : 0,
                    },
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