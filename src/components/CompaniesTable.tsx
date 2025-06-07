"use client";

import { useState, useEffect, FormEvent } from "react";
import { toast } from "react-toastify";
import { FaEdit, FaTrash, FaPlay, FaPause } from "react-icons/fa";
import dynamic from "next/dynamic";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";

const TipTapMenu = dynamic(() => import("@/components/TipTapMenu"), { ssr: false });

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
  clips?: { id: number }[];
};

const CompaniesTable = ({ initialCompanies }: { initialCompanies: Company[] }) => {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [description, setDescription] = useState("");
  const [moreDetails, setMoreDetails] = useState("");
  const [anime, setAnime] = useState<any>(null);
  const [selectedActions, setSelectedActions] = useState<{ [key: number]: string }>({});
  const [showConfirm, setShowConfirm] = useState<{ show: boolean; companyId: number | null; input: string }>({
    show: false,
    companyId: null,
    input: "",
  });

  const moreDetailsEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
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
    editable: !!editingCompany,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.ctrlKey || event.metaKey) {
          event.stopPropagation();
          return false;
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          return true;
        }
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
    if (anime && companies.length > 0) {
      anime({
        targets: ".table-row",
        translateX: [-30, 0],
        opacity: [0, 1],
        delay: anime.stagger(50),
        duration: 400,
        easing: "easeOutQuad",
      });

      const rows = document.querySelectorAll(".table-row");
      const handleMouseEnter = (row: Element) => {
        anime({
          targets: row,
          scale: 1.01,
          duration: 200,
          easing: "easeOutQuad",
        });
      };
      const handleMouseLeave = (row: Element) => {
        anime({
          targets: row,
          scale: 1,
          duration: 200,
          easing: "easeOutQuad",
        });
      };

      rows.forEach((row) => {
        row.addEventListener("mouseenter", () => handleMouseEnter(row));
        row.addEventListener("mouseleave", () => handleMouseLeave(row));
      });

      return () => {
        rows.forEach((row) => {
          row.removeEventListener("mouseenter", () => handleMouseEnter(row));
          row.removeEventListener("mouseleave", () => handleMouseLeave(row));
        });
      };
    }
  }, [anime, companies]);

  useEffect(() => {
    if (editingCompany) {
      setDescription(editingCompany.description);
      setMoreDetails(editingCompany.moreDetails || "");
      moreDetailsEditor?.commands.setContent(editingCompany.moreDetails || "");
      moreDetailsEditor?.setEditable(true);
    } else {
      moreDetailsEditor?.setEditable(false);
    }
  }, [editingCompany, moreDetailsEditor]);

  const handleAction = async (companyId: number, action: string) => {
    if (!action) return;
    if (action === "Remove") {
      setShowConfirm({ show: true, companyId, input: "" });
      return;
    }
    try {
      if (action === "Stop" || action === "Start") {
        const newStatus = action === "Stop" ? "Stopped" : "Active";
        const response = await fetch(`/api/company/${companyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) {
          throw new Error("API request failed");
        }
        setCompanies(
          companies.map((c) =>
            c.id === companyId ? { ...c, status: newStatus } : c
          )
        );
        setSelectedActions((prev) => ({ ...prev, [companyId]: "" }));
        toast.success(`Company ${newStatus === "Stopped" ? "stopped" : "started"} !`);
      }
    } catch (error: any) {
      console.error("Error in handleAction:", error);
      toast.error("Something wrong");
    }
  };

  const confirmRemove = async () => {
    if (showConfirm.companyId && showConfirm.input.toLowerCase() === "yes") {
      try {
        await fetch(`/api/company/${showConfirm.companyId}`, { method: "DELETE" });
        setCompanies(companies.filter((c) => c.id !== showConfirm.companyId));
        toast.success("Company removed successfully!");
        setShowConfirm({ show: false, companyId: null, input: "" });
      } catch (error: any) {
        console.error("Error in confirmRemove:", error);
        toast.error("Kuch galat ho gaya!");
      }
    } else {
      toast.error("Please type 'Yes' to confirm!");
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
  };

  const handleUpdate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const moreDetails = formData.get("moreDetails") as string;
    const rate = formData.get("rate") as string;
    const imageFile = formData.get("image") as File;

    if (imageFile && imageFile.size > 2 * 1024 * 1024) {
      toast.error("Image too large! Max 2MB allowed.");
      return;
    }
    try {
      let imageUrl = editingCompany?.image;
      if (imageFile && imageFile.size > 0) {
        const uploadFormData = new FormData();
        uploadFormData.append("imageFile", imageFile);
        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: uploadFormData,
        });
        if (!response.ok) {
          throw new Error("Image upload failed!");
        }
        const { imageUrl: uploadedUrl } = await response.json();
        imageUrl = uploadedUrl;
      }

      const response = await fetch(`/api/company/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          moreDetails: moreDetails || null,
          rate,
          image: imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Update failed!");
      }

      setCompanies(
        companies.map((c) =>
          c.id === parseInt(id)
            ? {
                ...c,
                name,
                description,
                moreDetails: moreDetails || null,
                rate,
                image: imageUrl as string,
              }
            : c
        )
      );
      setEditingCompany(null);
      toast.success("Changes saved!");
    } catch (error: any) {
      console.error("Error updating company:", error);
      toast.error(error.message || "Update failed!");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && e.target instanceof HTMLTextAreaElement) {
      e.stopPropagation();
    }
  };

  return (
    <div className="bg-gradient-to-br from-black to-gray-900 rounded-lg p-6 border border-gray-700 shadow-xl">
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-sm text-gray-400 font-orbitron">Currently no company is there 😅</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gradient-to-r from-black to-gray-800 z-10">
              <tr>
                <th
                  className="px theatres-3 py-2 text-yellow-500 animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif", textShadow: "0 0 5px rgba(234, 179, 8, 0.6)" }}
                >
                  Companies
                </th>
                <th
                  className="px-3 py-2 text-yellow-500 animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif", textShadow: "0 0 5px rgba(234, 179, 8, 0.6)" }}
                >
                  Status
                </th>
                <th
                  className="px-3 py-2 text-yellow-500 animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif", textShadow: "0 0 5px rgba(234, 179, 8, 0.6)" }}
                >
                  Clips Count
                </th>
                <th
                  className="px-3 py-2 text-yellow-500 animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif", textShadow: "0 0 5px rgba(234, 179, 8, 0.6)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="table-row border-b border-gray-700 hover:bg-gray-800 transition-colors duration-300"
                >
                  <td className="px-3 py-2 text-white">{company.name}</td>
                  <td className="px-3 py-2 text-white">{company.status}</td>
                  <td className="px-3 py-2 text-white">{company.clips?.length || 0}</td>
                  <td className="px-3 py-2 text-white flex space-x-2">
                    <button
                      onClick={() => handleEdit(company)}
                      className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black px-3 py-1 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all glow-item flex items-center space-x-1"
                    >
                      <FaEdit /> <span>Edit</span>
                    </button>
                    <select
                      value={selectedActions[company.id] || ""}
                      onChange={(e) => {
                        setSelectedActions((prev) => ({ ...prev, [company.id]: e.target.value }));
                        handleAction(company.id, e.target.value);
                      }}
                      className="bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl p-1 focus:outline-none focus:border-yellow-400 transition-all glow-item min-w-[150px]"
                    >
                      <option value="">Action</option>
                      {company.status === "Active" ? (
                        <option value="Stop">⏸ Stop</option>
                      ) : (
                        <option value="Start">▶ Start</option>
                      )}
                      <option value="Remove">🗑 Remove</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-black to-gray-900 p-6 rounded-lg w-full max-w-md border border-yellow-500 shadow-xl">
            <h2
              className="text-xl text-yellow-500 font-extrabold mb-4 animate-glow"
              style={{ fontFamily: "Gagalin, sans-serif", textShadow: "0 0 5px rgba(234, 179, 8, 0.6)" }}
            >
              Edit Company
            </h2>
            <form onSubmit={handleUpdate} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
              <input type="hidden" name="id" value={editingCompany.id} />
              <div>
                <label
                  htmlFor="name"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif" }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={editingCompany.name}
                  className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="image"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif" }}
                >
                  Image (Leave empty to keep current)
                </label>
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/jpeg,image/png,image/gif"
                  className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="rate"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif" }}
                >
                  Rate
                </label>
                <input
                  type="text"
                  id="rate"
                  name="rate"
                  defaultValue={editingCompany.rate}
                  className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif" }}
                >
                  Description (Plain Text)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm resize-y"
                  rows={5}
                  placeholder="Enter description (use full stops or commas for bullet points)"
                />
              </div>
              <div>
                <label
                  htmlFor="moreDetails"
                  className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
                  style={{ fontFamily: "Gagalin, sans-serif" }}
                >
                  More Details (Rich Text)
                </label>
                <div
                  className="w-full bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl shadow-md glow-item text-sm"
                  onKeyDown={(e) => {
                    if (e.ctrlKey || e.metaKey || e.key === "Enter") {
                      e.stopPropagation();
                    }
                  }}
                >
                  {moreDetailsEditor && <TipTapMenu editor={moreDetailsEditor} />}
                  <EditorContent editor={moreDetailsEditor} className="p-3 prose prose-invert max-w-none" />
                </div>
                <input type="hidden" name="moreDetails" value={moreDetails} />
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
                  onClick={() => setEditingCompany(null)}
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
              style={{ fontFamily: "Gagalin, sans-serif", textShadow: "0 0 5px rgba(234, 179, 8, 0.6)" }}
            >
              Confirm Removal
            </h2>
            <p className="text-white mb-4">Do you really want to remove this company? Type Yes to confirm.</p>
            <input
              type="text"
              value={showConfirm.input}
              onChange={(e) => setShowConfirm({ ...showConfirm, input: e.target.value })}
              className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
              placeholder="Type 'Yes'"
            />
            <div className="flex space-x-2 mt-4">
              <button
                onClick={confirmRemove}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all glow-item"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm({ show: false, companyId: null, input: "" })}
                className="w-full bg-gradient-to-r from-red-500 to-red-700 text-white py-2 rounded-xl hover:from-red-600 hover:to-red-800 hover:shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-all glow-item"
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

export default CompaniesTable;