// RevenueChart.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

const RevenueChart = () => {
  const { userId, isLoaded } = useAuth();
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [chartKey, setChartKey] = useState<number>(0);

  useEffect(() => {
    const fetchRevenueData = async () => {
      if (!isLoaded || !userId) {
        setError("Please log in to view your data.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching revenue data for userId:", userId);
        const response = await fetch(`/api/revenue?studentId=${userId}`, {
          headers: { "Cache-Control": "no-cache" },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("API Response:", data);

        if (!data || !Array.isArray(data) || data.length === 0) {
          setError("No revenue data available.");
          setLoading(false);
          return;
        }

        const monthlyData: { [year: string]: { [month: string]: number } } = {};

        data.forEach((record: { revenue: string; createdAt: string }) => {
          const date = new Date(record.createdAt);
          if (isNaN(date.getTime())) {
            console.warn("Invalid date in record:", record);
            return;
          }
          const year = date.getFullYear().toString();
          const month = date.toLocaleString("default", { month: "short" });
          const revenue = parseFloat(record.revenue) || 0;

          if (!monthlyData[year]) monthlyData[year] = {};
          monthlyData[year][month] = (monthlyData[year][month] || 0) + revenue;
        });

        const years = Object.keys(monthlyData)
          .map((year) => parseInt(year))
          .filter((year) => !isNaN(year))
          .sort((a, b) => b - a);
        setAvailableYears(years);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const selectedYearData = monthlyData[selectedYear.toString()] || {};
        const monthlyRevenue = months.map((month) => selectedYearData[month] || 0);

        setChartData({
          labels: months,
          datasets: [
            {
              label: `Monthly Revenue ($) (${selectedYear})`,
              data: monthlyRevenue,
              backgroundColor: "rgba(234, 179, 8, 0.6)",
              borderColor: "rgba(234, 179, 8, 1)",
              borderWidth: 2,
            },
          ],
        });

        setChartKey((prev) => prev + 1);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching revenue data:", err);
        setError("Failed to fetch data. Please try again.");
        setLoading(false);
      }
    };

    fetchRevenueData();
  }, [userId, isLoaded, selectedYear]);

  const chartOption = useMemo(() => {
    const fallbackData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Fallback Revenue ($)",
          data: [100, 200, 150, 300, 250, 400, 350, 500, 450, 600, 550, 700],
          backgroundColor: "rgba(234, 179, 8, 0.6)",
          borderColor: "rgba(234, 179, 8, 1)",
          borderWidth: 2,
        },
      ],
    };

    const dataToUse = chartData && chartData.labels.length && chartData.datasets[0]?.data.length ? chartData : fallbackData;

    const labels = dataToUse.labels;
    const data = dataToUse.datasets[0].data;

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#000000",
        borderColor: "#ffffff",
        borderWidth: 1,
        textStyle: {
          color: "#eab308",
          fontSize: 14,
        },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br />Revenue: $${param.value}`;
        },
      },
      xAxis: {
        type: "category",
        data: labels,
        axisLine: { lineStyle: { color: "#ffffff" } },
        axisLabel: { color: "#ffffff" },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#ffffff" } },
        axisLabel: { color: "#ffffff" },
        splitLine: { lineStyle: { color: "rgba(255, 255, 255, 0.1)" } },
      },
      series: [
        {
          type: "line",
          data: data,
          lineStyle: {
            color: "#eab308",
            width: 3,
          },
          itemStyle: {
            color: "#eab308",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#eab308" },
              { offset: 1, color: "#ffffff" },
            ]),
            opacity: 0.4,
          },
          animationDuration: 1000,
          animationEasing: "cubicOut",
          emphasis: {
            focus: "series",
          },
        },
      ],
      animation: true,
    };
  }, [chartData]);

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(event.target.value);
    if (!isNaN(year)) {
      setSelectedYear(year);
      setChartKey((prev) => prev + 1);
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-gray-900 to-black p-4 sm:p-6 rounded-lg border-2 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)] w-full hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
      style={{ filter: "drop-shadow(0 0 8px #eab308)" }}
    >
      <h2
        className="text-yellow-400 text-lg font-semibold mb-4 hover:text-yellow-300 transition-colors duration-200 animate-pulse"
        style={{ textShadow: "0 0 10px rgba(234, 179, 8, 0.8)" }}
      >
        📊 Monthly Revenue
      </h2>

      <div className="mb-6 flex justify-center">
        <div className="relative inline-block w-48">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full bg-black text-yellow-400 px-4 py-2 rounded-lg shadow-[0_0_10px_rgba(234,179,8,0.5)] hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300 appearance-none cursor-pointer"
            disabled={loading || !!error}
          >
            {availableYears.map((year) => (
              <option key={year} value={year} className="bg-gray-900 text-yellow-400">
                {year}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-yellow-400 text-center">Loading data...</p>
      ) : error ? (
        <div className="flex items-center justify-center h-[350px] rounded-lg">
          <p className="text-yellow-400 text-center">{error}</p>
        </div>
      ) : !chartData ? (
        <p className="text-yellow-400 text-center">No data available, using fallback data.</p>
      ) : (
        <div>
          <h3
            className="text-white text-md mb-2 animate-pulse"
            style={{ textShadow: "0 0 8px rgba(234, 179, 8, 0.6)" }}
          >
            Monthly Revenue ({selectedYear})
          </h3>
          <div style={{ height: "350px", width: "100%" }}>
            <ReactECharts
              key={chartKey}
              option={chartOption}
              style={{ height: "100%", width: "100%" }}
              onEvents={{
                error: (err: unknown) => console.error("ECharts Error:", err),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueChart;