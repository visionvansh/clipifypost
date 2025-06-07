
import { Editor } from "@tiptap/react";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
} from "react-icons/fa";

interface TipTapMenuProps {
  editor: Editor | null;
}

const TipTapMenu = ({ editor }: TipTapMenuProps) => {
  if (!editor) return null;

  const handleButtonClick = (e: React.MouseEvent, command: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    command();
    editor.chain().focus().run();
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-[#1a1a1a] border-b border-yellow-500">
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().toggleBold().run())}
        className={`p-2 rounded ${editor.isActive("bold") ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Bold"
      >
        <FaBold />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().toggleItalic().run())}
        className={`p-2 rounded ${editor.isActive("italic") ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Italic"
      >
        <FaItalic />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().toggleUnderline().run())}
        className={`p-2 rounded ${editor.isActive("underline") ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Underline"
      >
        <FaUnderline />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().toggleStrike().run())}
        className={`p-2 rounded ${editor.isActive("strike") ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Strikethrough"
      >
        <FaStrikethrough />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().toggleBulletList().run())}
        className={`p-2 rounded ${editor.isActive("bulletList") ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Bullet List"
      >
        <FaListUl />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().toggleOrderedList().run())}
        className={`p-2 rounded ${editor.isActive("orderedList") ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Ordered List"
      >
        <FaListOl />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().setTextAlign("left").run())}
        className={`p-2 rounded ${editor.isActive({ textAlign: "left" }) ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Align Left"
      >
        <FaAlignLeft />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().setTextAlign("center").run())}
        className={`p-2 rounded ${editor.isActive({ textAlign: "center" }) ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Align Center"
      >
        <FaAlignCenter />
      </button>
      <button
        onClick={(e) => handleButtonClick(e, () => editor.chain().setTextAlign("right").run())}
        className={`p-2 rounded ${editor.isActive({ textAlign: "right" }) ? "bg-yellow-500 text-black" : "text-gray-200 hover:bg-yellow-500 hover:text-black"} transition-all glow-item`}
        title="Align Right"
      >
        <FaAlignRight />
      </button>
    </div>
  );
};

export default TipTapMenu;
