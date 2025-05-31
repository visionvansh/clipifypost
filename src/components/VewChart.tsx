// ViewsChart.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension?: number;
    pointBackgroundColor: string;
    pointRadius: number;
  }[];
}

interface ViewRecord {
  views: string;
  createdAt: string;
}

interface MonthlyData {
  [year: string]: { [month: string]: number };
}

const ViewsChart: React.FC = () => {
  const { userId, isLoaded } = useAuth();
  const [monthlyChartData, setMonthlyChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [chartKey, setChartKey] = useState<number>(0);

  useEffect(() => {
    const fetchViewsData = async () => {
      if (!isLoaded) return;

      if (!userId) {
        setError("Please log in to view your data.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/views?studentId=${userId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data: ViewRecord[] = await response.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
          setError("No views data found.");
          setLoading(false);
          return;
        }

        const monthlyData: MonthlyData = {};

        data.forEach((record: ViewRecord) => {
          const date = new Date(record.createdAt);
          if (isNaN(date.getTime())) return;
          const year = date.getFullYear().toString();
          const month = date.toLocaleString("default", { month: "short" });
          const views = parseInt(record.views, 10) || 0;

          if (!monthlyData[year]) monthlyData[year] = {};
          monthlyData[year][month] = (monthlyData[year][month] || 0) + views;
        });

        const years = Object.keys(monthlyData)
          .map((year) => parseInt(year))
          .filter((year) => !isNaN(year))
          .sort((a, b) => b - a);
        setAvailableYears(years);

        const months = [
          "Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const selectedYearData = monthlyData[selectedYear.toString()] || {};
        const monthlyViews = months.map((month) => selectedYearData[month] || 0);

        const chartData: ChartData = {
          labels: months,
          datasets: [
            {
              label: `Monthly Views (${selectedYear})`,
              data: monthlyViews,
              borderColor: "#eab308",
              backgroundColor: "rgba(234, 179, 8, 0.2)",
              fill: true,
              tension: 0.4,
              pointBackgroundColor: "#eab308",
              pointRadius: 5,
            },
          ],
        };

        setMonthlyChartData(chartData);
        setChartKey((prev) => prev + 1);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch data. Please try again.");
        setLoading(false);
      }
    };

    fetchViewsData();
  }, [userId, isLoaded, selectedYear]);

  const chartOption = useMemo(() => {
    const fallbackData: ChartData = {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          label: "Fallback Views",
          data: [10, 20, 15, 30, 25, 40, 35, 50, 45, 60, 55, 70],
          borderColor: "#eab308",
          backgroundColor: "rgba(234, 179, 8, 0.2)",
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#eab308",
          pointRadius: 5,
        },
      ],
    };

    const dataToUse = monthlyChartData && monthlyChartData.labels.length && monthlyChartData.datasets[0]?.data.length ? monthlyChartData : fallbackData;

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
          return `${param.name}<br />Views: ${param.value}`;
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
  }, [monthlyChartData]);

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
        📊 Monthly Views
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

      {!isLoaded ? (
        <p className="text-yellow-400 text-center">Checking authentication...</p>
      ) : loading ? (
        <p className="text-yellow-400 text-center">Loading data...</p>
      ) : error ? (
        <div className="flex items-center justify-center h-[350px] rounded-lg">
          <p className="text-yellow-400 text-center">{error}</p>
        </div>
      ) : !monthlyChartData ? (
        <p className="text-yellow-400 text-center">No data available, using fallback data.</p>
      ) : (
        <div>
          <h3
            className="text-white text-md mb-2 animate-pulse"
            style={{ textShadow: "0 0 8px rgba(234, 179, 8, 0.6)" }}
          >
            Monthly Views ({selectedYear})
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

export default ViewsChart;