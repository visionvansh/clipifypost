"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { FaEdit } from "react-icons/fa";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import dynamic from "next/dynamic";

const TipTapMenu = dynamic(() => import("@/components/TipTapMenu"), { ssr: false });

type Brand = {
  id: number;
  name: string;
  description: string | null;
  moreDetails?: string | null;
  rate: number;
  status: "Active" | "Stopped";
  createdAt: Date;
  updatedAt: Date;
};

const BrandsTable = ({ initialBrands }: { initialBrands: Brand[] }) => {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [description, setDescription] = useState("");
  const [moreDetails, setMoreDetails] = useState("");
  const [anime, setAnime] = useState<any>(null);
  const [selectedActions, setSelectedActions] = useState<{ [key: number]: string }>({});
  const [showConfirm, setShowConfirm] = useState<{ show: boolean; brandId: number | null; input: string }>({
    show: false,
    brandId: null,
    input: "",
  });

  const moreDetailsEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: moreDetails,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html.length > 50000) {
        toast.error("More Details too large! Keep it concise.");
        return;
      }
      setMoreDetails(html);
    },
    editable: !!editingBrand,
    editorProps: {
      handleKeyDown: (view, event) => {
        console.log("TipTap KeyDown (Brand Edit):", event.key, event.ctrlKey || event.metaKey); // Debug
        // Block Enter without Shift to prevent form submission
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          return true; // Prevent default Enter behavior
        }
        // Allow Ctrl+C, Ctrl+V, and Cmd+C, Cmd+V for copy-paste
        if ((event.ctrlKey || event.metaKey) && (event.key === "c" || event.key === "v")) {
          return false; // Allow default copy-paste behavior
        }
        // Allow other key events to proceed normally
        return false;
      },
      handleClick: (view, pos, event) => {
        // Allow default click behavior, including cursor movement and right-click paste
        return false;
      },
    },
  });

  useEffect(() => {
    const loadAnime = async () => {
      const animeModule = await import("animejs");
      setAnime(() => animeModule.default);
    };
    loadAnime();
  }, []);

  useEffect(() => {
    if (anime && brands.length > 0) {
      anime({
        targets: ".table-row",
        translateX: [-100, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: "easeOutQuad",
      });

      const rows = document.querySelectorAll(".table-row");
      rows.forEach((row) => {
        row.addEventListener("mouseenter", () => {
          anime({
            targets: row,
            scale: 1.02,
            duration: 300,
            easing: "easeOutQuad",
          });
        });
        row.addEventListener("mouseleave", () => {
          anime({
            targets: row,
            scale: 1,
            duration: 300,
            easing: "easeOutQuad",
          });
        });
      });
    }
  }, [anime, brands]);

  useEffect(() => {
    if (editingBrand) {
      setDescription(editingBrand.description || "");
      setMoreDetails(editingBrand.moreDetails || "");
      if (moreDetailsEditor) {
        moreDetailsEditor.commands.setContent(editingBrand.moreDetails || "");
        moreDetailsEditor.setEditable(true);
      }
    } else {
      if (moreDetailsEditor) {
        moreDetailsEditor.setEditable(false);
      }
    }
  }, [editingBrand, moreDetailsEditor]);

  const handleAction = async (brandId: number, action: string) => {
    if (!action) return;
    if (action === "Remove") {
      setShowConfirm({ show: true, brandId, input: "" });
      return;
    }
    try {
      if (action === "Stop" || action === "Start") {
        const newStatus = action === "Stop" ? "Stopped" : "Active";
        const response = await fetch(`/api/brand/${brandId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "setStatus", status: newStatus }),
        });
        if (!response.ok) {
          throw new Error("API request failed");
        }
        setBrands(
          brands.map((b) =>
            b.id === brandId ? { ...b, status: newStatus } : b
          )
        );
        setSelectedActions((prev) => ({ ...prev, [brandId]: "" }));
        toast.success(`Promotion ${newStatus === "Stopped" ? "Stopped" : "Started"}!`);
      }
    } catch (error) {
      console.error("Error in handleAction:", error);
      toast.error("Something wrong!");
    }
  };

  const confirmRemove = async () => {
    if (showConfirm.brandId && showConfirm.input.toLowerCase() === "yes") {
      try {
        await fetch(`/api/brand/${showConfirm.brandId}`, { method: "DELETE" });
        setBrands(brands.filter((b) => b.id !== showConfirm.brandId));
        toast.success("Brand remove ho gaya!");
        setShowConfirm({ show: false, brandId: null, input: "" });
      } catch (error) {
        console.error("Error in confirmRemove:", error);
        toast.error("Kuch galat ho gaya!");
      }
    } else {
      toast.error("Please type 'Yes' to confirm!");
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id");
    const name = formData.get("name");
    const description = formData.get("description");
    const moreDetails = formData.get("moreDetails");
    const rate = formData.get("rate");

    console.log("Brand Edit Form Submit:", [...formData.entries()]); // Debug

    try {
      const response = await fetch(`/api/brand/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, moreDetails: moreDetails || null, rate: parseFloat(rate as string) }),
      });
      if (!response.ok) {
        throw new Error("Update failed!");
      }
      setBrands(
        brands.map((b) =>
          b.id === parseInt(id as string)
            ? { ...b, name: name as string, description: description as string | null, moreDetails: moreDetails as string | null, rate: parseFloat(rate as string) }
            : b
        )
      );
      setEditingBrand(null);
      toast.success("Promotion data got updated");
    } catch (error) {
      console.error("Brand Update Error:", error);
      toast.error("Update failed!");
    }
  };

  return (
    <div className="bg-gradient-to-br from-black to-gray-900 rounded-lg p-6 border border-yellow-500 shadow-xl hover:shadow-2xl transition-all duration-300">
      {brands.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm text-gray-400 font-orbitron">No promotion present in editors hub right now.😢</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm glass-table rounded-lg">
            <thead className="sticky top-0 bg-gradient-to-r from-black to-gray-800 z-10">
              <tr>
                <th
                  className="px-4 py-2 text-yellow-500 animate-glow glow-text"
                  style={{ fontFamily: "'Gagalin', sans-serif", textShadow: "0 0 10px rgba(234,179,8,0.6)" }}
                >
                  Promos
                </th>
                <th
                  className="px-4 py-2 text-yellow-500 animate-glow glow-text"
                  style={{ fontFamily: "'Gagalin', sans-serif", textShadow: "0 0 10px rgba(234,179,8,0.6)" }}
                >
                  Status
                </th>
                <th
                  className="px-4 py-2 text-yellow-500 animate-glow glow-text"
                  style={{ fontFamily: "'Gagalin', sans-serif", textShadow: "0 0 10px rgba(234,179,8,0.6)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr
                  key={brand.id}
                  className="table-row border-b border-gray-700 hover:bg-gray-800 transition-colors duration-300"
                >
                  <td className="px-4 py-2 text-white">{brand.name}</td>
                  <td className="px-4 py-2 text-white">{brand.status}</td>
                  <td className="px-4 py-2 text-white flex space-x-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black px-3 py-1 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all glow-item flex items-center space-x-1"
                    >
                      <FaEdit /> <span>Edit</span>
                    </button>
                    <select
                      value={selectedActions[brand.id] || ""}
                      onChange={(e) => {
                        setSelectedActions((prev) => ({ ...prev, [brand.id]: e.target.value }));
                        handleAction(brand.id, e.target.value);
                      }}
                      className="bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl p-1 focus:outline-none focus:border-yellow-400 transition-all glow-item min-w-[150px]"
                    >
                      <option value="">Action</option>
                      {brand.status === "Active" ? (
                        <option value="Stop">Stop</option>
                      ) : (
                        <option value="Start">Start</option>
                      )}
                      <option value="Remove">Remove</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editingBrand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-lg w-full max-w-md border border-yellow-500 shadow-xl">
            <h2
              className="text-xl text-yellow-500 font-extrabold mb-4 animate-glow"
              style={{ fontFamily: "'Gagalin', sans-serif", textShadow: "0 0 10px rgba(234,179,8,0.6)" }}
            >
              Edit Brand
            </h2>
            <form onSubmit={handleUpdate} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={editingBrand.id} />
              <div>
                <label
                  htmlFor="name"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "'Gagalin', sans-serif" }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={editingBrand.name}
                  className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "'Gagalin', sans-serif" }}
                >
                  Description (Plain Text)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                  className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm h-20 resize-none"
                />
              </div>
              <div>
                <label
                  htmlFor="moreDetails"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "'Gagalin', sans-serif" }}
                >
                  More Details (Rich Text)
                </label>
                <div
                  className="w-full bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl shadow-md glow-item text-sm"
                >
                  {moreDetailsEditor && <TipTapMenu editor={moreDetailsEditor} />}
                  <EditorContent editor={moreDetailsEditor} className="p-3 prose prose-invert max-w-none" />
                </div>
                <input type="hidden" name="moreDetails" value={moreDetails} />
              </div>
              <div>
                <label
                  htmlFor="rate"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "'Gagalin', sans-serif" }}
                >
                  Rate
                </label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  defaultValue={editingBrand.rate}
                  className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all glow-item"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBrand(null)}
                  className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-2 rounded-xl hover:from-red-600 hover:to-red-800 hover:shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all glow-item"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-lg w-full max-w-md border border-yellow-500 shadow-xl">
            <h2
              className="text-xl text-yellow-500 font-extrabold mb-4 animate-glow"
              style={{ fontFamily: "'Gagalin', sans-serif", textShadow: "0 0 10px rgba(234,179,8,0.6)" }}
            >
              Confirm Removal
            </h2>
            <p className="text-white mb-4">Do you really want to remove this brand? Type Yes to confirm.</p>
            <input
              type="text"
              value={showConfirm.input}
              onChange={(e) => setShowConfirm({ ...showConfirm, input: e.target.value })}
              className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
              placeholder="Type &quot;Yes&quot;"
            />
            <div className="flex space-x-2 mt-4">
              <button
                onClick={confirmRemove}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all glow-item"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm({ show: false, brandId: null, input: "" })}
                className="w-full bg-gradient-to-r from-red-500 to-red-800 text-white py-2 rounded-xl hover:from-red-600 hover:to-red-900 hover:shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all glow-item"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandsTable;