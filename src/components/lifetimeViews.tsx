"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";

const LifetimeViews = () => {
  const { userId } = useAuth();
  const [views, setViews] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchLifetimeViews = async () => {
      try {
        const response = await fetch(`/api/views?studentId=${userId}`);
        const data = await response.json();

        if (!data || data.length === 0) {
          setError("0"); // No views found, show 0
          setLoading(false);
          return;
        }

        // Calculate total lifetime views
        const totalViews = data.reduce((sum: number, record: { views: string }) => {
          return sum + (parseInt(record.views) || 0);
        }, 0);

        setViews(totalViews.toLocaleString());
        setLoading(false);
      } catch (err) {
        console.error("Error fetching lifetime views:", err);
        setError("Failed to fetch data.");
        setLoading(false);
      }
    };

    fetchLifetimeViews();
  }, [userId]);

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-md w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-xs bg-blue-600 px-3 py-1 rounded-full text-white font-semibold shadow-md">
          Lifetime Views
        </span>
        <div className="ml-2 sm:ml-4">
          <Image
            src="/more.png"
            alt="More"
            width={20}
            height={20}
            className="opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
          />
        </div>
      </div>

      {/* Views Count */}
      <h1
        className="font-bold my-3 text-blue-400 tracking-wide sm:text-left text-center"
        style={{
          fontSize: "clamp(1.5rem, 5vw, 2.25rem)",
          wordBreak: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {loading ? "Loading..." : error ? <span className="text-blue-400">{error}</span> : views}
      </h1>

      <h2 className="capitalize text-sm font-medium text-gray-400 sm:text-left text-center">
        Total Views
      </h2>
    </div>
  );
};

export default LifetimeViews;