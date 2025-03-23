"use client";

import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { useAuth } from "@clerk/nextjs";
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

const SHEET_ID = "17qAzmlanl85g97oowSdM6mDjz7nsEW7ChptSqVsy0Hw";
const API_KEY = "AIzaSyDnfCVlTNgP7UV3s87vhzKvTLstXL3syC0";

const RevenueChart = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:M?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length < 2) {
          setError("No revenue data found.");
          setLoading(false);
          return;
        }

        // Extract months from the first row
        const months: string[] = data.values[0].slice(1); // Skips "User ID"

        // Initialize an array to store total views per month
        const monthlyTotals: number[] = new Array(months.length).fill(0);

        // Loop through all users and sum their views per month
        for (let i = 1; i < data.values.length; i++) {
          const userViews: number[] = data.values[i]
            .slice(1)
            .map((value: string) => Number(value) || 0);

          userViews.forEach((value: number, index: number) => {
            monthlyTotals[index] += value; // Accumulate views per month
          });
        }

        setChartData({
          labels: months,
          datasets: [
            {
              label: "Total Views",
              data: monthlyTotals,
              borderColor: "#ff6b6b", // 🔴 Red Line
              backgroundColor: "rgba(255, 107, 107, 0.2)", // Light Red Fill
              pointBackgroundColor: "#ff6b6b",
              pointBorderColor: "#fff",
              pointHoverRadius: 6,
              tension: 0.4, // Smooth curve
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
  }, []);

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md w-full">
      <h2 className="text-white text-lg font-semibold mb-4">📈 Monthly Total Views</h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="w-full h-[300px]">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: true } },
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
      )}
    </div>
  );
};

export default RevenueChart;
