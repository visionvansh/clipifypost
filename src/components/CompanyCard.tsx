"use client";

import Image from "next/image";
import Link from "next/link";
import { MdAttachMoney } from "react-icons/md";
import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

type Company = {
  id: number;
  name: string;
  description: string;
  moreDetails?: string | null;
  rate: string;
  image: string;
  status: "Active" | "Stopped";
  createdAt: Date;
  updatedAt: Date;
};

interface CompanyCardProps {
  company: Company;
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parse description for bullet points (inspired by reference code)
  const parseDescription = (desc: string): string[] => {
    const cleanDesc = desc.replace(/<\/?[^>]+(>|$)/g, ""); // Remove HTML tags
    return cleanDesc
      .split(/[,.]/) // Split on full stop or comma
      .map((item) => item.trim())
      .filter((item) => item); // Remove empty items
  };

  const bulletPoints = parseDescription(company.description);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
    ],
    content: company.moreDetails || "<p>No additional details available.</p>",
    editable: false,
  });

  return (
    <>
      <div className="bg-[#15151b] p-4 sm:p-6 rounded-3xl shadow-lg hover:shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all duration-300 transform hover:-translate-y-2 md:hover:-translate-y-4 float-animation pulse-animation w-full sm:max-w-xs lg:max-w-3xl animate-fadeIn">
        <div className="relative">
          <Image
            src={company.image}
            alt={company.name}
            width={350}
            height={280}
            className="rounded-xl mx-auto max-w-full h-auto border border-yellow-500 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all duration-300"
          />
        </div>
        <h2 className="text-lg sm:text-xl md:text-3xl font-semibold text-gray-100 mt-4 sm:mt-6 text-center mb-4">
          {company.name}
        </h2>
        {bulletPoints.length > 0 ? (
          <ul className="mb-4 space-y-1">
            {bulletPoints.map((point, index) => (
              <li key={index} className="text-sm text-white flex items-center">
                <span className="mr-2">→</span>
                <span className="inline-block px-2 py-1 rounded-full bg-gray-900 border border-gray-500 hover:bg-yellow-500 hover:text-black transition-all duration-200 max-w-full break-words">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-center text-xs sm:text-sm mt-1 mb-3">
            No description available
          </p>
        )}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black px-4 py-2 rounded-full shadow-lg hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all mt-2 mx-auto w-full text-center text-sm font-medium tracking-wide glow-text"
        >
          More Details
        </button>
        <div className="bg-black bg-opacity-50 p-2 rounded-full flex items-center justify-center mt-2 mb-4">
          <MdAttachMoney className="text-yellow-500 glowing-icon moving-icon" />
          <p className="text-yellow-500 font-bold glow-text text-sm sm:text-lg">
            {company.rate} per 100k views
          </p>
        </div>
        <Link href={`/list/paste-link/${company.id}/verify`}>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-300 hover:from-yellow-400 hover:to-yellow-200 text-black px-4 sm:px-7 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all mt-4 mx-auto w-full text-center cursor-pointer text-xs sm:text-sm font-medium tracking-wide button-hover">
            🚀 Get Started
          </div>
        </Link>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-lg w-full max-w-2xl border border-yellow-500 shadow-xl glow-item">
            <h2 className="text-xl text-yellow-500 font-extrabold mb-4 animate-glow font-orbitron">
              {company.name} Details
            </h2>
            <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
              {editor && (
                <EditorContent
                  editor={editor}
                  className="prose prose-invert max-w-none text-white"
                />
              )}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-2 rounded-xl hover:from-red-600 hover:to-red-800 hover:shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all glow-item"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}