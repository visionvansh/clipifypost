"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

const SPREADSHEET_ID = "1G-Zp3rE9ASxbHJSycSrgktEMCXYGldXdPAi1JlhCzkw";
const API_KEY = "AIzaSyDnfCVlTNgP7UV3s87vhzKvTLstXL3syC0";
const SHEET_NAME = "Sheet1";

const LifetimeRevenueCard = () => {
  const { userId } = useAuth();
  const [revenue, setRevenue] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchRevenue = async () => {
      const URL = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

      try {
        const response = await fetch(URL);
        const data = await response.json();

        if (!data.values) {
          setError("No data found.");
          setLoading(false);
          return;
        }

        const headers: string[] = data.values[0];
        const userIdIndex = headers.indexOf("userId");
        const revenueIndex = headers.indexOf("lifetimeRevenue");

        if (userIdIndex === -1 || revenueIndex === -1) {
          setError("Invalid column names.");
          setLoading(false);
          return;
        }

        const userRow = data.values.find((row: string[]) => row[userIdIndex] === userId);

        if (!userRow) {
          setError("No revenue recorded yet.");
          setLoading(false);
          return;
        }

        setRevenue(`$${parseFloat(userRow[revenueIndex]).toLocaleString()}`);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching revenue:", err);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [userId]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-md w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs bg-yellow-600 px-3 py-1 rounded-full text-white font-semibold shadow-md">
          Lifetime Revenue
        </span>
        <div className="ml-2 sm:ml-4"> {/* Push three dots slightly right */}
          <Image
            src="/more.png"
            alt="More"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          />
        </div>
      </div>

      {/* Revenue Amount */}
      <h1
        className="font-bold my-3 text-yellow-400 tracking-wide sm:text-left text-center"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2.25rem)", // Responsive font size
          wordBreak: "break-word", // Prevent overflow
          overflowWrap: "break-word",
        }}
      >
        {loading ? "Loading..." : error ? <span className="text-red-500">{error}</span> : revenue}
      </h1>

      <h2 className="capitalize text-sm font-medium text-gray-400 sm:text-left text-center">
        Total Revenue
      </h2>
    </div>
  );
};

export default LifetimeRevenueCard;
