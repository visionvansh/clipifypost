"use client";

import { useState } from "react";

interface MonthSelectorProps {
  selectedMonth?: string;
  onSelect?: (month: string) => void;
  buttonText?: string;
}

const MonthSelector = ({ selectedMonth, onSelect, buttonText }: MonthSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generate last 12 months
  const months = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      value: date.toISOString().slice(0, 7), // YYYY-MM
      label: date.toLocaleString("en-US", { month: "long", year: "numeric" }),
    });
  }

  const currentMonth = selectedMonth || today.toISOString().slice(0, 7);

  const handleSelect = (month: string) => {
    if (onSelect) {
      onSelect(month);
    } else {
      // Update URL with selected month
      const url = new URL(window.location.href);
      url.searchParams.set("month", month);
      window.history.pushState({}, "", url);
      // Trigger page reload to refetch data
      window.location.reload();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        aria-label="month-selector"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs sm:text-sm bg-blue-600 px-3 py-1 rounded-full text-white font-semibold shadow-md hover:bg-blue-500 transition-colors"
      >
        {buttonText || months.find((m) => m.value === currentMonth)?.label || "Select Month"}
      </button>
      {isOpen && (
        <div className="absolute z-10 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          {months.map((month) => (
            <button
              key={month.value}
              onClick={() => handleSelect(month.value)}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors"
            >
              {month.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonthSelector;