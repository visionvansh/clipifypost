"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

// Menu items array
const menuItems = [
  {
    title: "MENU",
    items: [
      { icon: "/homex.png", label: "Home", href: "/", visible: ["admin", "manager", "users", "new-users"] },
      { icon: "/managerx.png", label: "Manager", href: "/list/manager", visible: ["manager"] },
      { icon: "/new-userx.png", label: "New Users", href: "/list/new-users", visible: ["manager"] },
      { icon: "/uploadx.png", label: "Uploaders Hub", href: "/list/paste-link", visible: ["users", "new-users"] },
      { icon: "/content-creator.png", label: "Editors Hub", href: "/list/editors", visible: ["users", "new-users"] },
      { icon: "/paymentx.png", label: "Payment", href: "/list/payment", visible: ["users", "new-users"] },
      { icon: "/checkx.png", label: "Uploaders Pannel", href: "/list/checking", visible: ["admin"] },
      { icon: "/positionx.png", label: "Editors Pannel", href: "/list/editors-checking", visible: ["admin"] },
      { icon: "/addx.png", label: "Add Promotion", href: "/list/social-profiles", visible: ["admin", "manager"] },
      { icon: "/addx.png", label: "User Stats & Payment", href: "/list/users-stats", visible: ["admin"] },
      { icon: "/addx.png", label: "Discord", href: "/list/discord", visible: ["admin"] },
    ],
  },
];

const Navbar = () => {
  const { user } = useUser();
  const role = user?.publicMetadata.role as string;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [displayRevenue, setDisplayRevenue] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [displayViews, setDisplayViews] = useState(0);
  const [discordUsername, setDiscordUsername] = useState("Not Connected");
  const [loading, setLoading] = useState(true);

  // Filter menu items based on role
  const visibleItems = menuItems[0].items.filter((item) => item.visible.includes(role));

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const response = await fetch("/api/user-data");
          const data = await response.json();
          if (response.ok) {
            setDiscordUsername(data.discordUsername || "Not Connected");
            setTotalRevenue(data.totalRevenue);
            setTotalViews(data.totalViews);
          } else {
            console.error("Error from API:", data.error);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Animate revenue counter
  useEffect(() => {
    if (totalRevenue === 0) return;
    const duration = 2000;
    const increment = totalRevenue / (duration / 50);
    let currentRevenue = 0;
    const interval = setInterval(() => {
      currentRevenue += increment;
      if (currentRevenue >= totalRevenue) {
        currentRevenue = totalRevenue;
        clearInterval(interval);
      }
      setDisplayRevenue(Math.round(currentRevenue));
    }, 50);
    return () => clearInterval(interval);
  }, [totalRevenue]);

  // Animate views counter
  useEffect(() => {
    if (totalViews === 0) return;
    const duration = 2000;
    const increment = totalViews / (duration / 50);
    let currentViews = 0;
    const interval = setInterval(() => {
      currentViews += increment;
      if (currentViews >= totalViews) {
        currentViews = totalViews;
        clearInterval(interval);
      }
      setDisplayViews(Math.round(currentViews));
    }, 50);
    return () => clearInterval(interval);
  }, [totalViews]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="bg-black p-4 border-b-2 border-yellow-500 shadow-xl hover:shadow-2xl transition-all duration-300"
      style={{ boxShadow: "0 0 15px rgba(234, 179, 8, 0.6)" }}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left: Discord Connect/Disconnect Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-1"
        >
          {loading ? (
            <span className="text-[8px] lg:text-sm font-medium text-white">Loading...</span>
          ) : discordUsername && discordUsername !== "Not Connected" ? (
            <>
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-300"
                  fill="currentColor"
                  viewBox="0 0 71 55"
                  style={{ filter: "drop-shadow(0 0 5px rgba(234,179,8,0.8))" }}
                >
                  <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2887 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.518 0.385175 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6547 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6025 45.5576C70.655 45.518 70.6886 45.459 70.6942 45.3942C72.0057 30.4555 68.7557 17.0889 60.7372 4.9795C60.7139 4.9429 60.6803 4.9147 60.6401 4.8978H60.1045ZM23.7259 37.3253C20.2276 37.3253 17.3451 33.9781 17.3451 29.9268C17.3451 25.8755 20.1698 22.5283 23.7259 22.5283C27.308 22.5283 30.1646 25.9047 30.1208 29.9268C30.1208 33.9781 27.2818 37.3253 23.7259 37.3253ZM46.6988 37.3253C43.2005 37.3253 40.318 33.9781 40.318 29.9268C40.318 25.8755 43.1427 22.5283 46.6988 22.5283C50.2809 22.5283 53.1376 25.9047 53.0937 29.9268C53.0937 33.9781 50.2547 37.3253 46.6988 37.3253Z" />
                </svg>
                <span className="text-[8px] lg:text-sm text-white" style={{ textShadow: "0 0 5px rgba(255,255,255,0.8)" }}>
                  Connected to{" "}
                  <span className="text-yellow-400" style={{ textShadow: "0 0 5px rgba(234,179,8,0.8)" }}>
                    {discordUsername}
                  </span>
                </span>
              </div>
              {/* Disconnect Discord button ko comment out kiya gaya hai */}
              <form action="/api/auth/discord/disconnect" method="POST">
                <button
                  type="submit"
                  className="text-[8px] lg:text-sm bg-gradient-to-r from-red-500 to-red-700 text-white px-2 lg:px-4 py-1 lg:py-2 rounded-full hover:from-red-600 hover:to-red-800 hover:shadow-[0_0_15px_rgba(255,0,0,0.8)] transition-all duration-200 shadow-md"
                >
                  Disconnect Discord
                </button>
              </form> 
            </>
          ) : (
            <Link
              href="/api/auth/discord"
              className="flex items-center gap-2 text-[8px] lg:text-sm bg-gradient-to-r from-yellow-500 to-yellow-300 text-black px-2 lg:px-4 py-1 lg:py-2 rounded-full hover:from-yellow-400 hover:to-yellow-200 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all duration-200 shadow-md"
            >
              <svg
                className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-700"
                fill="currentColor"
                viewBox="0 0 71 55"
                style={{ filter: "drop-shadow(0 0 5px rgba(234,179,8,0.8))" }}
              >
                <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2887 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.518 0.385175 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6547 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6025 45.5576C70.655 45.518 70.6886 45.459 70.6942 45.3942C72.0057 30.4555 68.7557 17.0889 60.7372 4.9795C60.7139 4.9429 60.6803 4.9147 60.6401 4.8978H60.1045ZM23.7259 37.3253C20.2276 37.3253 17.3451 33.9781 17.3451 29.9268C17.3451 25.8755 20.1698 22.5283 23.7259 22.5283C27.308 22.5283 30.1646 25.9047 30.1208 29.9268C30.1208 33.9781 27.2818 37.3253 23.7259 37.3253ZM46.6988 37.3253C43.2005 37.3253 40.318 33.9781 40.318 29.9268C40.318 25.8755 43.1427 22.5283 46.6988 22.5283C50.2809 22.5283 53.1376 25.9047 53.0937 29.9268C53.0937 33.9781 50.2547 37.3253 46.6988 37.3253Z" />
              </svg>
              Connect To Discord
            </Link>
          )}
        </motion.div>

        {/* Center: Menu Items on Large Screens */}
        <div className="hidden lg:flex items-center gap-3">
          {visibleItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-2 text-white hover:text-yellow-500 transition-all duration-300 px-2 py-1 rounded-md hover:bg-gray-900 hover:shadow-[0_0_10px_rgba(234,179,8,0.5)]"
            >
              <Image
                src={item.icon}
                alt={item.label}
                width={20}
                height={20}
                className="filter drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]"
              />
              <span style={{ textShadow: "0 0 5px rgba(234, 179, 8, 0.8)" }}>{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Right: Total Views, Total Revenue, User Info, Three-dot */}
        <div className="flex items-center gap-1 lg:gap-6">
          {/* Total Views */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-1 bg-black px-1 py-0.5 lg:px-4 lg:py-2 rounded-full border border-yellow-500 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all duration-300"
          >
            <svg
              className="w-2.5 h-2.5 lg:w-6 lg:h-6 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 0 5px rgba(234,179,8,0.8))" }}
            >
              <path d="M12 4.5C7.5 4.5 3.738 7.252 2 12c1.738 4.748 5.5 7.5 10 7.5s8.262-2.752 10-7.5c-1.738-4.748-5.5-7.5-10-7.5zm0 12c-2.485 0-4.5-2.015-4.5-4.5S9.515 7.5 12 7.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5zm0-2c1.38 0 2.5-1.12 2.5-2.5S13.38 9.5 12 9.5 9.5 10.62 9.5 12s1.12 2.5 2.5 2.5z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-[6px] lg:text-xs text-gray-400">Total Views</span>
              <motion.span
                className="text-yellow-400 font-bold text-[8px] lg:text-lg"
                style={{ textShadow: "0 0 5px rgba(234, 179, 8, 0.8)" }}
              >
                {loading ? "Loading..." : displayViews}
              </motion.span>
            </div>
          </motion.div>

          {/* Total Revenue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex items-center gap-1 bg-black px-1 py-0.5 lg:px-4 lg:py-2 rounded-full border border-yellow-500 hover:scale-105 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all duration-300"
          >
            <svg
              className="w-2.5 h-2.5 lg:w-6 lg:h-6 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 0 5px rgba(234,179,8,0.8))" }}
            >
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-[6px] lg:text-xs text-gray-400">Your Earnings</span>
              <motion.span
                className="text-yellow-400 font-bold text-[8px] lg:text-lg"
                style={{ textShadow: "0 0 5px rgba(234, 179, 8, 0.8)" }}
              >
                {loading ? "Loading..." : `$${displayRevenue}`}
              </motion.span>
            </div>
          </motion.div>

          {/* User Info */}
          <div className="flex items-center gap-1">
            <div className="flex flex-col text-right">
              <span className="text-[8px] lg:text-xs text-white">{user?.username || "Guest"}</span>
              <span className="text-[6px] lg:text-[10px] text-gray-400">
                {(user?.publicMetadata.role as string) || "User"}
              </span>
            </div>
            <UserButton />
          </div>

          {/* Three-dot Menu for Mobile */}
          <button className="lg:hidden" onClick={() => setIsMenuOpen(true)}>
            <svg
              className="w-4 h-4 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 0 5px rgba(234,179,8,0.8))" }}
            >
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 left-0 w-full h-full bg-black z-50 lg:hidden"
          style={{ boxShadow: "inset 0 0 20px rgba(234, 179, 8, 0.3)" }}
        >
          <button
            onClick={() => setIsMenuOpen(false)}
            className="absolute top-4 right-4"
          >
            <svg
              className="w-6 h-6 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ filter: "drop-shadow(0 0 5px rgba(234,179,8,0.8))" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex flex-col items-center justify-center h-full gap-6">
            {visibleItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-4 text-white hover:text-yellow-500 transition-all duration-300 px-4 py-2 rounded-md hover:bg-gray-900 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                >
                  <Image
                    src={item.icon}
                    alt={item.label}
                    width={28}
                    height={28}
                    className="filter drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]"
                  />
                  <span
                    className="text-lg"
                    style={{ textShadow: "0 0 5px rgba(234, 179, 8, 0.8)" }}
                  >
                    {item.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Navbar;