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

const SHEET_ID = "17qAzmlanl85g97oowSdM6mDjz7nsEW7ChptSqVsy0Hw";
const API_KEY = "AIzaSyDnfCVlTNgP7UV3s87vhzKvTLstXL3syC0";

const RevenueChart = () => {
  const { userId } = useAuth();
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noViews, setNoViews] = useState(false);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!userId) return;

      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:M?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length === 0) {
          setError("No revenue data found.");
          setLoading(false);
          return;
        }

        const userRow = data.values.find((row: string[]) => row[0] === userId);
        if (!userRow) {
          setNoViews(true);
          setLoading(false);
          return;
        }

        const months = data.values[0].slice(1);
        const revenues = userRow.slice(1).map((value: string) => Number(value) || 0);

        if (revenues.every((rev: number) => rev === 0)) {
          setNoViews(true);
        }

        setChartData({
          labels: months,
          datasets: [
            {
              label: "Views",
              data: revenues,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 2,
              barThickness: window.innerWidth < 640 ? 12 : 20, // ✅ Wider bars on mobile
              categoryPercentage: window.innerWidth < 640 ? 0.4 : 0.6, // ✅ More spacing on mobile
              barPercentage: window.innerWidth < 640 ? 0.6 : 0.9, // ✅ Adds spacing between bars
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
  }, [userId]);

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md w-full">
      <h2 className="text-white text-lg font-semibold mb-4">📊 Monthly Views</h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : noViews ? (
        <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg">
          <p className="text-gray-400">No views made by you till now</p>
        </div>
      ) : (
        <div className="w-full h-[300px]">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: true } },
              scales: {
                x: {
                  grid: { color: "rgba(255,255,255,0.1)" },
                  ticks: {
                    color: "#fff",
                    font: { size: window.innerWidth < 640 ? 10 : 12 }, // ✅ Adjust font size for mobile
                    autoSkip: false, // ✅ Show all months
                    maxRotation: window.innerWidth < 640 ? 45 : 0, // ✅ Prevents text overlap
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
      )}
    </div>
  );
};

export default RevenueChart;
