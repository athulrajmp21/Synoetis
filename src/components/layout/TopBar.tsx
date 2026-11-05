import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Moon,
  Sun,
  Laptop,
  Database,
  CheckCircle2,
} from "lucide-react";
import { useThemeStore } from "@/stores/useThemeStore";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { systemService } from "@/services/api";
import { SystemInfo } from "@/types/system";
import { MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS } from "./navConfig";

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { theme, setTheme } = useThemeStore();
  const { setSearchOpen, setQuickCaptureOpen } = useNavigationStore();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    systemService.getSystemInfo().then(setSystemInfo).catch(console.error);
  }, []);

  // Determine current active page label
  const allNav = [...MAIN_NAV_ITEMS, ...BOTTOM_NAV_ITEMS];
  const currentItem = allNav.find((i) => i.path === location.pathname) || {
    label: "Dashboard",
  };

  const cycleTheme = () => {
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md px-5 flex items-center justify-between select-none sticky top-0 z-10">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Life OS</span>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
          {currentItem.label}
        </h1>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 transition-colors text-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search tasks, notes, courses, DSA...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500 dark:text-slate-400 shadow-2xs">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* SQLite Database Status Pill */}
        <div
          title={systemInfo ? `Database: ${systemInfo.db_path} (${systemInfo.total_tables} tables active)` : "Connecting to SQLite..."}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-mono"
        >
          <Database className="w-3 h-3 text-indigo-500" />
          <span>SQLite</span>
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
        </div>

        {/* Quick Capture Button */}
        <button
          onClick={() => setQuickCaptureOpen(true)}
          title="Quick Capture (Ctrl+N)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>

        {/* Theme Mode Toggle Button */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
        >
          {theme === "light" && <Sun className="w-4 h-4 text-amber-500" />}
          {theme === "dark" && <Moon className="w-4 h-4 text-indigo-400" />}
          {theme === "system" && <Laptop className="w-4 h-4 text-slate-400" />}
        </button>
      </div>
    </header>
  );
};
