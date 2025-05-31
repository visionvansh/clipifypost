"use client";

import React, { useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface MonthlyRevenueChartClientProps {
  type: "Monthly Revenue";
  yearlyData: { [year: string]: { [month: string]: number } };
  availableYears: number[];
}

const MonthlyRevenueChartClient = ({ type, yearlyData, availableYears }: MonthlyRevenueChartClientProps) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [chartKey, setChartKey] = useState<number>(0);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const selectedYearData = yearlyData[selectedYear.toString()] || {};
  const monthlyRevenue = months.map((month) => selectedYearData[month] || 0);

  const chartData = {
    labels: months,
    datasets: [
      {
        label: `Monthly Revenue ($) (${selectedYear})`,
        data: monthlyRevenue,
        backgroundColor: "rgba(234, 179, 8, 0.2)",
        borderColor: "#eab308",
        borderWidth: 2,
      },
    ],
  };

  const chartOption = useMemo(() => {
    const fallbackData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Fallback Revenue ($)",
          data: [100, 200, 150, 300, 250, 400, 350, 500, 450, 600, 550, 700],
          backgroundColor: "rgba(234, 179, 8, 0.2)",
          borderColor: "#eab308",
          borderWidth: 2,
        },
      ],
    };

    const dataToUse = chartData.labels.length && chartData.datasets[0]?.data.length ? chartData : fallbackData;

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
          console.log("Tooltip data:", param);
          return `${param.name}<br />Revenue: $${param.value}`;
        },
      },
      xAxis: {
        type: "category",
        data: dataToUse.labels,
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
          data: dataToUse.datasets[0].data,
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

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    if (!isNaN(year)) {
      console.log("Year changed to:", year);
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
        📊 {type}
      </h2>

      <div className="mb-6 flex justify-center">
        <div className="relative inline-block w-48">
          <select
            value={selectedYear}
            onChange={handleYearChange}
            className="w-full bg-black text-yellow-400 px-4 py-2 rounded-lg shadow-[0_0_10px_rgba(234,179,8,0.5)] hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-300 appearance-none cursor-pointer"
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

      {availableYears.length === 0 ? (
        <div className="flex items-center justify-center h-[350px] rounded-lg">
          <p className="text-yellow-400 text-center">No data available</p>
        </div>
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

export default MonthlyRevenueChartClient;