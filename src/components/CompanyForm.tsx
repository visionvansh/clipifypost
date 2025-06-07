"use client";

import { useState, FormEvent, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const TipTapMenu = dynamic(() => import("@/components/TipTapMenu"), { ssr: false });

export default function CompanyForm({ action }: { action: (formData: FormData) => Promise<any> }) {
  const [description, setDescription] = useState("");
  const [moreDetails, setMoreDetails] = useState<string | null>("");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const moreDetailsEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
    ],
    content: moreDetails || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html.length > 50000) { // Limit to ~50KB
        toast.error("More Details too large! Keep it concise.");
        return;
      }
      setMoreDetails(html);
    },
    editable: true,
    editorProps: {
      handleKeyDown: (view, event) => {
        // Prevent formatting shortcuts (e.g., Ctrl+B, Ctrl+U) from submitting form
        if (event.ctrlKey || event.metaKey) {
          event.stopPropagation();
          return false; // Let TipTap handle the shortcut
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault(); // Prevent Enter from submitting
          return true;
        }
        return false;
      },
    },
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const imageFile = formData.get("image") as File;

    // Client-side image validation
    if (imageFile && imageFile.size > 2 * 1024 * 1024) { // 2 MB limit
      toast.error("Image too large! Max 2MB allowed.");
      return;
    }

    try {
      const result = await action(formData);
      if (result.success && result.redirectTo) {
        router.push(result.redirectTo);
        toast.success("Company added successfully!");
      }
    } catch (error: any) {
      console.error("Form Submit Error:", error.message);
      toast.error(error.message || "Failed to add company!");
    }
  };

  // Prevent Enter key from submitting form in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && e.target instanceof HTMLTextAreaElement) {
      e.stopPropagation();
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4 mb-8">
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
          className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="image"
          className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow"
          style={{ fontFamily: "'Gagalin', sans-serif" }}
        >
          Image
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
          style={{ fontFamily: "'Gagalin', sans-serif" }}
        >
          Rate
        </label>
        <input
          type="text"
          id="rate"
          name="rate"
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
          className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all glow-item text-sm resize-y"
          rows={5}
          placeholder="Enter description (use full stops or commas for bullet points)"
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
          onKeyDown={(e) => {
            // Prevent TipTap key events from bubbling to form
            if (e.ctrlKey || e.metaKey || e.key === "Enter") {
              e.stopPropagation();
            }
          }}
        >
          {moreDetailsEditor && <TipTapMenu editor={moreDetailsEditor} />}
          <EditorContent editor={moreDetailsEditor} className="p-3 prose prose-invert max-w-none" />
        </div>
        <input type="hidden" name="moreDetails" value={moreDetails || ""} />
      </div>
      <button
        type="submit"
        className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all glow-item"
      >
        Add Company
      </button>
    </form>
  );
}