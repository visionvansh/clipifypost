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

const SHEET_ID = "15wqCCDsf_mEn-Ro-JBLlB0GUdmYB8CJP1dV2fQbA24Q";
const API_KEY = "AIzaSyDnfCVlTNgP7UV3s87vhzKvTLstXL3syC0";

const ViewsChart = () => {
  const { userId } = useAuth();
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!userId) return;

      try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:M?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.values || data.values.length === 0) {
          setError("No data available.");
          setLoading(false);
          return;
        }

        const userRow = data.values.find((row: string[]) => row[0] === userId);

        if (!userRow) {
          setError("No revenue recorded yet.");
          setLoading(false);
          return;
        }

        const labels = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const revenueData = userRow.slice(1).map((val: string) => Number(val) || 0);

        setChartData({
          labels,
          datasets: [
            {
              label: "Monthly Revenue ($)",
              data: revenueData,
              backgroundColor: "rgba(34, 197, 94, 0.6)", // ✅ Green bars
              borderColor: "rgba(34, 197, 94, 1)", // ✅ Green border
              borderWidth: 2,
              barThickness: window.innerWidth < 640 ? 12 : 20, // ✅ Adjust bar thickness for mobile
              categoryPercentage: 0.6,
              barPercentage: 0.8, // ✅ Ensures even spacing between bars
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
      <h2 className="text-white text-lg font-semibold mb-4">📊 Monthly Revenue</h2>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg">
          <p className="text-gray-400">No revenue made by you till now</p>
        </div>
      ) : (
        <div className="w-full h-[300px]">
          <Bar
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, labels: { color: "#fff" } },
              },
              scales: {
                x: {
                  grid: { 
                    color: "rgba(255, 255, 255, 0.1)", // ✅ Faint grid lines for better appearance
                    drawTicks: true, 
                    drawOnChartArea: true,
                    lineWidth: window.innerWidth < 640 ? 0.5 : 1, // ✅ Thinner grids on mobile
                  },
                  ticks: {
                    color: "#fff",
                    font: { size: window.innerWidth < 640 ? 10 : 12 },
                    autoSkip: false, // ✅ Show all months
                    maxRotation: window.innerWidth < 640 ? 45 : 0, 
                    minRotation: window.innerWidth < 640 ? 45 : 0,
                  },
                },
                y: {
                  grid: { 
                    color: "rgba(255, 255, 255, 0.1)", // ✅ Faint grid lines
                    drawTicks: true, 
                    drawOnChartArea: true, 
                    lineWidth: window.innerWidth < 640 ? 0.5 : 1, // ✅ Responsive grid width
                  },
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

export default ViewsChart;
