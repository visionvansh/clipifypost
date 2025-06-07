"use client";

import { useState, useRef, FormEvent, FC, useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

const TipTapMenu = dynamic(() => import("@/components/TipTapMenu"), { ssr: false });

interface BrandFormProps {
  action: (formData: FormData) => Promise<void>;
  initialData?: {
    id: number;
    name: string;
    description: string;
    moreDetails?: string | null;
    rate: number;
  };
}

const BrandForm: FC<BrandFormProps> = ({ action, initialData }) => {
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [moreDetails, setMoreDetails] = useState<string | null>(initialData?.moreDetails || "");
  const [rate, setRate] = useState(initialData?.rate?.toString() || "");
  const formRef = useRef<HTMLFormElement>(null);

  const moreDetailsEditor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: initialData?.moreDetails || "",
    onUpdate: ({ editor }: { editor: Editor }) => {
      const html = editor.getHTML();
      if (html.length > 50000) {
        toast.error("More Details too large! Keep it concise.");
        return;
      }
      setMoreDetails(html);
    },
    editable: true,
    editorProps: {
      handleKeyDown: (view: any, event: KeyboardEvent) => {
        console.log("TipTap KeyDown (Brand Form):", event.key, event.ctrlKey || event.metaKey); // Debug
        // Block Enter without Shift to prevent form submission
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          event.stopPropagation();
          return true; // Prevent default Enter behavior
        }
        // Allow Ctrl+V or Cmd+V for pasting
        if ((event.ctrlKey || event.metaKey) && event.key === "v") {
          return false; // Allow default paste behavior
        }
        // Allow other key events to proceed normally
        return false;
      },
      handleClick: (view: any, pos: number, event: MouseEvent) => {
        // Only prevent default for specific cases if needed, allow paste via right-click
        return false; // Allow default click behavior, including right-click paste
      },
    },
  });

  // Sync editor content when initialData changes
  useEffect(() => {
    if (moreDetailsEditor && initialData?.moreDetails !== moreDetailsEditor.getHTML()) {
      moreDetailsEditor.commands.setContent(initialData?.moreDetails || "");
    }
  }, [initialData, moreDetailsEditor]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    console.log("Brand Form Submit:", [...formData.entries()]); // Debug
    try {
      toast.success(initialData ? "Brand updated successfully!" : "Brand added successfully!"); // Moved before action
      await action(formData);
    } catch (error: any) {
      if (error.message === "NEXT_REDIRECT") {
        console.log("Redirecting after brand action, ignoring NEXT_REDIRECT"); // Debug
        return; // Skip error handling for redirect
      }
      console.error("Brand Form Error:", error.message);
      toast.error(error.message || "Failed to process brand!");
    }
  };

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={handleSubmit}
      className="w-full bg-gradient-to-br from-black to-gray-900 p-6 rounded-lg shadow-xl border border-yellow-500/50 mb-8 animate-slideIn"
    >
      {initialData && <input type="hidden" name="id" value={initialData.id} />}
      <div className="mb-4">
        <label htmlFor="name" className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Brand Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow">
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
          placeholder="Brand description..."
          className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-xl focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm h-12 resize-y"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="moreDetails" className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow">
          More Details (Rich Text)
        </label>
        <div
          className="w-full bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-lg shadow-md glow-item text-sm"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        >
          {moreDetailsEditor && <TipTapMenu editor={moreDetailsEditor} />}
          <EditorContent editor={moreDetailsEditor} className="p-3 prose prose-invert max-w-none" />
        </div>
        <input type="hidden" name="moreDetails" value={moreDetails || ""} />
      </div>
      <div className="mb-4">
        <label htmlFor="rate" className="text-yellow-500 text-sm font-semibold mb-1 block animate-glow">
          Rate
        </label>
        <input
          type="number"
          id="rate"
          name="rate"
          placeholder="Rate"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="w-full p-3 bg-[#1a1a1a] text-gray-200 border border-yellow-500 rounded-lg focus:outline-none focus:border-yellow-400 transition-all shadow-md glow-item text-sm"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-2 rounded-xl hover:from-yellow-600 hover:to-yellow-800 hover:shadow-[0_0_15px_rgba(234,179,8,0.8)] transition-all shadow-md text-sm font-bold tracking-wide transform hover-scale duration-200 glow-item"
      >
        {initialData ? "Update Brand" : "Add Brand"}
      </button>
    </form>
  );
};

export default BrandForm;