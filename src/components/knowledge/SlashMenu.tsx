import React, { useEffect, useRef, useState } from "react";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  List,
  Code2,
  Sparkles,
  Quote,
  Minus,
} from "lucide-react";
import { BlockType } from "./NotionBlock";

export interface SlashMenuItem {
  type: BlockType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const MENU_ITEMS: SlashMenuItem[] = [
  {
    type: "paragraph",
    title: "Text",
    description: "Plain text paragraph for notes and explanations",
    icon: Type,
    keywords: ["text", "p", "paragraph", "normal"],
  },
  {
    type: "h1",
    title: "Heading 1",
    description: "Large title heading for main sections",
    icon: Heading1,
    keywords: ["h1", "heading1", "header", "title"],
  },
  {
    type: "h2",
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    keywords: ["h2", "heading2", "subtitle"],
  },
  {
    type: "h3",
    title: "Heading 3",
    description: "Small sub-section heading",
    icon: Heading3,
    keywords: ["h3", "heading3", "subheading"],
  },
  {
    type: "todo",
    title: "To-do List",
    description: "Interactive checkbox item",
    icon: CheckSquare,
    keywords: ["todo", "task", "check", "checkbox"],
  },
  {
    type: "bullet",
    title: "Bulleted List",
    description: "Simple bullet point for lists",
    icon: List,
    keywords: ["bullet", "list", "ul"],
  },
  {
    type: "code",
    title: "Code Snippet",
    description: "Syntax highlighted code snippet block",
    icon: Code2,
    keywords: ["code", "rust", "snippet", "pre"],
  },
  {
    type: "callout",
    title: "Callout",
    description: "Highlighted callout box for key takeaways",
    icon: Sparkles,
    keywords: ["callout", "info", "note", "alert"],
  },
  {
    type: "quote",
    title: "Quote",
    description: "Indented quote or theorem definition",
    icon: Quote,
    keywords: ["quote", "blockquote"],
  },
  {
    type: "divider",
    title: "Divider",
    description: "Horizontal rule to separate sections",
    icon: Minus,
    keywords: ["divider", "hr", "line", "separator"],
  },
];

interface SlashMenuProps {
  position: { top: number; left: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export const SlashMenu: React.FC<SlashMenuProps> = ({
  position,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = MENU_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? Math.max(0, filteredItems.length - 1) : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onSelect(filteredItems[selectedIndex].type);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredItems, selectedIndex, onSelect, onClose]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: Math.min(position.top + 28, window.innerHeight - 340),
        left: Math.min(position.left, window.innerWidth - 300),
      }}
      className="z-50 w-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter commands..."
          className="w-full px-2 py-1 text-xs bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
        />
      </div>

      <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5">
        {filteredItems.length === 0 ? (
          <div className="p-3 text-center text-xs text-slate-400">
            No matching blocks found
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onSelect(item.type)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div
                  className={`p-1.5 rounded-md mt-0.5 ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold leading-tight">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
