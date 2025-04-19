"use client";

import Image from "next/image";
import { useState } from "react";

interface MonthSelectorMenuProps {
  selectedMonth?: string | undefined;
  onSelect: React.Dispatch<React.SetStateAction<string | undefined>>;
}

export default function MonthSelectorMenu({ selectedMonth, onSelect }: MonthSelectorMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = -12; i <= 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleString("default", { month: "long", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  };

  const monthOptions = getMonthOptions();

  const currentMonthLabel =
    monthOptions.find((option) => option.value === selectedMonth)?.label ||
    "Select Month";

  const handleMonthSelect = (month: string) => {
    onSelect(month);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 bg-gray-700 text-white rounded-lg text-xs font-semibold hover:bg-gray-600"
      >
        {currentMonthLabel}
        <Image src="/more.png" alt="More" width={12} height={12} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg z-10">
          {monthOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleMonthSelect(option.value)}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}