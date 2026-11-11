import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CheckCircle2,
  Code2,
  Briefcase,
  FolderGit2,
  Calendar,
  BookOpen,
  Settings,
  Plus,
  Search,
  Timer,
  Sun,
  Moon,
  Copy,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ClipboardPaste,
  Terminal,
} from "lucide-react";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useFocusTimerStore } from "@/stores/useFocusTimerStore";

interface ContextMenuPosition {
  x: number;
  y: number;
}

export const GlobalContextMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setQuickCaptureOpen, setSearchOpen } = useNavigationStore();
  const { theme, setTheme } = useThemeStore();
  const { isRunning, startTimer, pauseTimer, setModalOpen } = useFocusTimerStore();

  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    e.preventDefault();

    const selection = window.getSelection()?.toString().trim() || "";
    setSelectedText(selection);

    const menuWidth = 230;
    const menuHeight = 420;

    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 12);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 12);

    setPosition({ x: Math.max(10, x), y: Math.max(10, y) });
    setIsOpen(true);
  }, []);

  useEffect(() => {
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("click", closeMenu);
    window.addEventListener("resize", closeMenu);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleContextMenu, closeMenu]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (selectedText) {
      await navigator.clipboard.writeText(selectedText);
    }
    closeMenu();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const activeEl = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
      if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        const start = activeEl.selectionStart || 0;
        const end = activeEl.selectionEnd || 0;
        activeEl.setRangeText(text, start, end, "end");
      }
    } catch (err) {
      console.warn("Could not read clipboard:", err);
    }
    closeMenu();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    closeMenu();
  };

  const toggleFocus = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
    closeMenu();
  };

  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[9999] w-[230px] rounded-2xl bg-[#FAF8F5]/95 dark:bg-[#141312]/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-2xl p-1.5 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Quick Actions Section */}
      <div className="space-y-0.5 pb-1 mb-1 border-b border-stone-200/70 dark:border-stone-800/70">
        <button
          onClick={() => {
            setQuickCaptureOpen(true);
            closeMenu();
          }}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer font-medium"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-3.5 h-3.5 text-amber-500" />
            <span>Quick Capture</span>
          </div>
          <kbd className="font-mono text-[10px] text-stone-400 dark:text-stone-500">Ctrl+N</kbd>
        </button>

        <button
          onClick={() => {
            setSearchOpen(true);
            closeMenu();
          }}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer font-medium"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-stone-500" />
            <span>Global Search</span>
          </div>
          <kbd className="font-mono text-[10px] text-stone-400 dark:text-stone-500">Ctrl+K</kbd>
        </button>

        <button
          onClick={toggleFocus}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer font-medium"
        >
          <div className="flex items-center gap-2">
            <Timer className={`w-3.5 h-3.5 ${isRunning ? "text-amber-500 animate-spin" : "text-stone-500"}`} />
            <span>{isRunning ? "Pause Focus Timer" : "Start Focus Timer"}</span>
          </div>
          <span className="text-[10px] text-stone-400 font-mono">
            {isRunning ? "Running" : "Idle"}
          </span>
        </button>
      </div>

      {/* Clipboard Section (if selection exists or active input) */}
      {selectedText && (
        <div className="space-y-0.5 pb-1 mb-1 border-b border-stone-200/70 dark:border-stone-800/70">
          <button
            onClick={handleCopy}
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer font-medium"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-stone-500" />
              <span>Copy Selection</span>
            </div>
            <kbd className="font-mono text-[10px] text-stone-400 dark:text-stone-500">Ctrl+C</kbd>
          </button>
        </div>
      )}

      {/* Navigation Quick Jump */}
      <div className="space-y-0.5 pb-1 mb-1 border-b border-stone-200/70 dark:border-stone-800/70">
        <div className="px-2.5 py-0.5 text-[10px] uppercase font-semibold text-stone-400 tracking-wider">
          Jump To Module
        </div>

        {[
          { path: "/", label: "Command Center", icon: LayoutDashboard },
          { path: "/career", label: "Career OS", icon: Briefcase },
          { path: "/dsa", label: "DSA Tracker", icon: Code2 },
          { path: "/projects", label: "Projects OS", icon: FolderGit2 },
          { path: "/snippets", label: "Snippet Vault", icon: Terminal },
          { path: "/tasks", label: "My Tasks", icon: CheckCircle2 },
          { path: "/calendar", label: "Calendar", icon: Calendar },
          { path: "/notes", label: "Knowledge Hub", icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                closeMenu();
              }}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl transition cursor-pointer font-medium ${
                isActive
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* System & Window Controls */}
      <div className="space-y-0.5 pt-0.5">
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer font-medium"
        >
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-stone-500" />
            )}
            <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
          </div>
        </button>

        <button
          onClick={() => {
            window.location.reload();
            closeMenu();
          }}
          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer font-medium"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Reload View</span>
          </div>
          <kbd className="font-mono text-[10px] text-stone-400 dark:text-stone-500">Ctrl+R</kbd>
        </button>
      </div>
    </div>
  );
};
