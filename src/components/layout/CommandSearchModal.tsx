import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, CornerDownLeft, X } from "lucide-react";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS } from "./navConfig";

export const CommandSearchModal: React.FC = () => {
  const { isSearchOpen, setSearchOpen } = useNavigationStore();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const allItems = [...MAIN_NAV_ITEMS, ...BOTTOM_NAV_ITEMS];
  const filtered = allItems.filter(
    (item) =>
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.category?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      } else if (e.key === "Escape" && isSearchOpen) {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Type a command or navigate to a module..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No matching modules or actions found.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                Navigation
              </div>
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.path);
                      setSearchOpen(false);
                      setQuery("");
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                      <span>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.shortcut && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.shortcut}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-[10px] text-slate-400">
          <span>Navigate with arrows</span>
          <div className="flex items-center gap-1 font-mono">
            <span>Press</span>
            <kbd className="px-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded flex items-center">
              <CornerDownLeft className="w-2.5 h-2.5" />
            </kbd>
            <span>to select</span>
          </div>
        </div>
      </div>
    </div>
  );
};
