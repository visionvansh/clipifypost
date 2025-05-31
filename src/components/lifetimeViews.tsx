"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { FaEllipsisH } from "react-icons/fa";

const LifetimeViews = () => {
  const { userId } = useAuth();
  const [views, setViews] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setViews("0");
      setLoading(false);
      return;
    }

    const fetchLifetimeViews = async () => {
      try {
        const response = await fetch(`/api/views?studentId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch views data");
        }

        const data = await response.json();

        if (!data || data.length === 0) {
          setViews("0");
          setLoading(false);
          return;
        }

        const totalViews = data.reduce((sum: number, record: { views: string }) => {
          return sum + (parseInt(record.views) || 0);
        }, 0);

        setViews(totalViews.toLocaleString("en-US"));
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching lifetime views:", err.message);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchLifetimeViews();
  }, [userId]);

  return (
    <div className="bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-xl p-4 border-2 border-yellow-500 shadow-xl w-full flex flex-col hover:scale-105 hover:shadow-2xl transition-all duration-300">
      <div className="flex justify-between items-center">
        <span className="text-xs bg-black px-3 py-1 rounded-full text-white font-semibold shadow-md">
          Lifetime
        </span>
        <FaEllipsisH className="text-yellow-500 hover:text-yellow-600 transition-colors duration-200 cursor-pointer" />
      </div>

      <h1
        className="font-bold my-3 text-black tracking-wide sm:text-left text-center"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {loading ? "Loading..." : error ? <span className="text-red-500">{error}</span> : views}
      </h1>

      <h2 className="capitalize text-sm font-medium text-gray-900 sm:text-left text-center">
        Lifetime Views
      </h2>
    </div>
  );
};

export default LifetimeViews;