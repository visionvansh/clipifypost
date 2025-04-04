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

const SHEET_ID = "15wqCCDsf_mEn-Ro-JBLlB0GUdmYB8CJP1dV2fQbA24Q";
const API_KEY = "AIzaSyDnfCVlTNgP7UV3s87vhzKvTLstXL3syC0";

const RevenueChart = () => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noRevenue, setNoRevenue] = useState(false);

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

        // Extract months from the first row (ignoring "User ID")
        const months: string[] = data.values[0].slice(1);

        // Sum revenue for each month
        const totalRevenuePerMonth: number[] = new Array(months.length).fill(0);

        data.values.slice(1).forEach((row: string[]) => {
          row.slice(1).forEach((value: string, index: number) => {
            totalRevenuePerMonth[index] += parseFloat(value) || 0;
          });
        });

        if (totalRevenuePerMonth.every((rev) => rev === 0)) {
          setNoRevenue(true);
        }

        setChartData({
          labels: months,
          datasets: [
            {
              label: "Monthly Revenue ($)",
              data: totalRevenuePerMonth,
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
  }, []);

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-md w-full">
      <h2 className="text-white text-lg font-semibold mb-4">💰 Monthly Revenue</h2>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : noRevenue ? (
        <div className="flex items-center justify-center h-[300px] bg-gray-800 rounded-lg">
          <p className="text-gray-400">No revenue recorded yet.</p>
        </div>
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
