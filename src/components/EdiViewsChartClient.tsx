"use client";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { useState } from "react";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface MonthlyViewsChartClientProps {
  type: "Monthly Views";
  yearlyData: { [year: string]: { [month: string]: number } };
  availableYears: number[];
}

const MonthlyViewsChartClient = ({ type, yearlyData, availableYears }: MonthlyViewsChartClientProps) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Monthly Chart Data for selected year
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const selectedYearData = yearlyData[selectedYear] || {};
  const monthlyViews = months.map((month) => selectedYearData[month] || 0);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: `Monthly Views (${selectedYear})`,
        data: monthlyViews,
        backgroundColor: "rgba(59, 130, 246, 0.6)", // Blue bars
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        barThickness: window.innerWidth < 640 ? 12 : 20,
        categoryPercentage: 0.6,
        barPercentage: 0.8,
      },
    ],
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md w-full">
      <h2 className="text-white text-lg font-semibold mb-4">📊 {type}</h2>

      {/* Year Selection Dropdown */}
      <div className="mb-6 flex justify-center">
        <div className="relative inline-block w-48">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg shadow-lg hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300 appearance-none cursor-pointer"
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

      {availableYears.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg">
          <p className="text-gray-400">No views recorded yet</p>
        </div>
      ) : (
        <div>
          <h3 className="text-white text-md mb-2">Monthly Views ({selectedYear})</h3>
          <div className="w-full h-[300px]">
            <Bar
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
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                      drawTicks: true,
                      drawOnChartArea: true,
                      lineWidth: window.innerWidth < 640 ? 0.5 : 1,
                    },
                    ticks: {
                      color: "#fff",
                      font: { size: window.innerWidth < 640 ? 10 : 12 },
                      autoSkip: false,
                      maxRotation: window.innerWidth < 640 ? 45 : 0,
                      minRotation: window.innerWidth < 640 ? 45 : 0,
                    },
                  },
                  y: {
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                      drawTicks: true,
                      drawOnChartArea: true,
                      lineWidth: window.innerWidth < 640 ? 0.5 : 1,
                    },
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

export default MonthlyViewsChartClient;