"use client";

import { useRouter, usePathname } from "next/navigation";
import { FaHome, FaBuilding } from "react-icons/fa";

const BottomNavBar = () => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { name: "Editors Hub", path: "/list/social-profiles", icon: <FaHome /> },
    { name: "Uploaders Hub", path: "/list/social-profiles/company", icon: <FaBuilding /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-black to-gray-900 border-t border-yellow-500/50 shadow-xl z-50">
      <div className="flex justify-around items-center py-4">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center text-gray-200 transition-all duration-300 ${
              pathname === item.path ? "text-yellow-500 glow-text" : "hover:text-yellow-400"
            }`}
          >
            {item.icon}
            <span className="text-sm font-semibold font-orbitron">{item.name}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;