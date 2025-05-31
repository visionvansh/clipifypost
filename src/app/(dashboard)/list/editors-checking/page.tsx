"use client";

import { Suspense, useState, useEffect } from "react";
import ReelActionForm from "@/components/ReelActionForm";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Pagination from "@/components/Pagination";
import TableSearch from "@/components/TableSearch";
import { useSearchParams } from "next/navigation"; // Import useSearchParams

type UserReelWithBrand = {
  id: number;
  videoUrl: string | null;
  status: string;
  createdAt: string;
  brand: { name: string };
  student: { username: string };
  publishedUrl: string | null;
  views: number;
  disapprovalMessage?: string | null;
};

type Brand = {
  id: number;
  name: string;
};

type User = {
  id: string;
  username: string;
};

export default function AdminPage() {
  const searchParams = useSearchParams(); // Use hook to access query params
  const [message, setMessage] = useState<string | null>(null);
  const [data, setData] = useState<{
    users: User[];
    brands: Brand[];
    reels: UserReelWithBrand[];
    count: number;
    authError: boolean;
  }>({
    users: [],
    brands: [],
    reels: [],
    count: 0,
    authError: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = searchParams.toString(); // Convert searchParams to query string
        const response = await fetch(`/api/admin/data?${query}`);
        if (response.ok) {
          const result = await response.json();
          setData({
            users: result.users,
            brands: result.brands,
            reels: result.reels,
            count: result.count,
            authError: result.authError,
          });
        } else {
          setData((prev) => ({ ...prev, authError: true }));
        }
      } catch (error) {
        console.error("Fetch data error:", error);
        setData((prev) => ({ ...prev, authError: true }));
      }
    };

    fetchData();
  }, [searchParams]);

  const handleBulkDisable = async () => {
    try {
      const response = await fetch("/api/admin/bulk-disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setMessage("Update buttons disabled for all users");
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("Failed to disable update buttons");
      }
    } catch (error) {
      console.error("Bulk disable error:", error);
      setMessage("Failed to disable update buttons");
    }
  };

  const handleBulkEnable = async () => {
    try {
      const response = await fetch("/api/admin/bulk-enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setMessage("Update buttons enabled for all users");
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage("Failed to enable update buttons");
      }
    } catch (error) {
      console.error("Bulk enable error:", error);
      setMessage("Failed to disable update buttons");
    }
  };

  const { users, brands, reels, count, authError } = data;

  if (authError) {
    return (
      <div className="text-white text-center mt-10 text-xl">
        Please log in to access admin panel.
      </div>
    );
  }

  // Access query params using get()
  const userId = searchParams.get("userId");
  const brandId = searchParams.get("brandId");
  const page = searchParams.get("page");

  return (
    <div className="bg-black w-full h-screen overflow-hidden">
      <div className="p-6 h-full overflow-y-auto text-white">
        {message && (
          <div className="fixed top-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50">
            {message}
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight transform rotate-3d">
            EDITORS CHECKING PANNEL
          </h1>
          <div className="w-full md:w-auto">
            <TableSearch />
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mt-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <a
                key={user.id}
                href={`?userId=${user.id}`}
                className="p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition duration-300"
              >
                <span className="text-blue-400 hover:text-blue-300">
                  {user.username}
                </span>
              </a>
            ))}
          </div>
        </div>

        {userId && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mt-8 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Brands for {users.find((u) => u.id === userId)?.username}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {brands.map((brand) => (
                <a
                  key={brand.id}
                  href={`?userId=${userId}&brandId=${brand.id}`}
                  className="p-4 rounded-lg bg-gray-800 hover:bg-gray-700 transition duration-300"
                >
                  <span className="text-blue-400 hover:text-blue-300">
                    {brand.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {userId && brandId && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mt-8 shadow-lg overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-300">
                  <th className="p-4 font-medium">Reel</th>
                  <th className="p-4 font-medium">Brand</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Uploaded</th>
                  <th className="p-4 font-medium">Published URL</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reels.map((reel) => (
                  <tr
                    key={reel.id}
                    className="border-t border-gray-700 bg-gray-800 hover:bg-gray-700 transition duration-300"
                  >
                    <td className="p-4">
                      {reel.videoUrl ? (
                        <a
                          href={reel.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View Reel
                        </a>
                      ) : (
                        "No Reel"
                      )}
                    </td>
                    <td className="p-4">{reel.brand.name}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          reel.status === "PENDING"
                            ? "bg-yellow-500/20 text-yellow-300"
                            : reel.status === "APPROVED"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}
                      >
                        {reel.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {new Date(reel.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      {reel.publishedUrl ? (
                        <a
                          href={reel.publishedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          View Published
                        </a>
                      ) : (
                        "Not Published"
                      )}
                    </td>
                    <td className="p-4">
                      <ReelActionForm reel={reel} setMessage={setMessage} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-4">
              <Pagination
                page={page ? parseInt(page) : 1}
                count={count}
              />
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mt-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Bulk Actions</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={handleBulkDisable}
              className="py-3 px-6 rounded-lg bg-red-600 text-white font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Disable Update Buttons for All Users
            </button>
            <button
              onClick={handleBulkEnable}
              className="py-3 px-6 rounded-lg bg-green-600 text-white font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Enable Update Buttons for All Users
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}