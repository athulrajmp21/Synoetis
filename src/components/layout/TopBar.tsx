import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Search,
  Plus,
  Moon,
  Sun,
  Laptop,
  Timer,
  Play,
  Pause,
  Minus,
  Square,
  Copy,
  X,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useThemeStore } from "@/stores/useThemeStore";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useFocusTimerStore } from "@/stores/useFocusTimerStore";
import { useKeybindingsStore } from "@/stores/useKeybindingsStore";
import { systemService, settingsService } from "@/services/api";
import { MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS } from "./navConfig";

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { theme, setTheme } = useThemeStore();
  const { setSearchOpen, setQuickCaptureOpen } = useNavigationStore();
  const { mode, timeLeft, isRunning, setModalOpen, startTimer, pauseTimer } = useFocusTimerStore();
  const { keybindings } = useKeybindingsStore();

  const searchShortcut = keybindings.omnisearch?.binding || "Ctrl+K";

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const allNav = [...MAIN_NAV_ITEMS, ...BOTTOM_NAV_ITEMS];
  const currentItem = allNav.find((i) => i.path === location.pathname) || {
    label: "Dashboard",
  };

  const cycleTheme = () => {
    if (theme === "system") setTheme("dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("system");
  };

  const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri) return;
    let unlistenFn: (() => void) | null = null;
    try {
      const appWindow = getCurrentWindow();
      appWindow.isMaximized().then(setIsMaximized).catch(() => {});
      appWindow.onResized(async () => {
        try {
          setIsMaximized(await appWindow.isMaximized());
        } catch {}
      }).then((fn) => {
        unlistenFn = fn;
      }).catch(() => {});
    } catch {}

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [isTauri]);

  const handleMinimize = async () => {
    if (isTauri) {
      try {
        await getCurrentWindow().minimize();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleMaximize = async () => {
    if (isTauri) {
      try {
        await getCurrentWindow().toggleMaximize();
        setIsMaximized(await getCurrentWindow().isMaximized());
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClose = async () => {
    if (isTauri) {
      try {
        const traySetting = await settingsService.getSetting("minimize_to_tray_on_close");
        if (traySetting === "false") {
          await systemService.exitApp();
        } else {
          await getCurrentWindow().close();
        }
      } catch (e) {
        console.error(e);
        await getCurrentWindow().close();
      }
    }
  };

  return (
    <header
      data-tauri-drag-region
      onDoubleClick={handleToggleMaximize}
      className="h-14 border-b border-stone-200/80 dark:border-stone-800/80 bg-[#FAF8F5]/80 dark:bg-[#0C0B0A]/80 backdrop-blur-md px-4 flex items-center justify-between select-none sticky top-0 z-20"
    >
      {/* Left: App Title & Breadcrumbs */}
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <img src="/logo.png" alt="Synoetis" className="w-4 h-4 object-contain rounded" />
        <span className="text-[11px] font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
          Synoetis
        </span>
        <span className="text-stone-300 dark:text-stone-700">/</span>
        <h1 className="text-xs font-medium text-stone-800 dark:text-stone-200">
          {currentItem.label}
        </h1>
      </div>

      {/* Center: Global Search Bar */}
      <div className="flex-1 max-w-sm mx-4">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center justify-between px-3 py-1 rounded-md border border-stone-200/90 dark:border-stone-800/90 bg-stone-100/60 dark:bg-stone-900/40 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700 transition-colors text-xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-amber-500" />
            <span>Omnisearch database ({searchShortcut})...</span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-white dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 rounded text-stone-400 dark:text-stone-500">
            {searchShortcut}
          </kbd>
        </button>
      </div>

      {/* Right: Focus Timer, Quick Action, Theme Toggle, Window Controls */}
      <div className="flex items-center gap-2" data-tauri-drag-region="false">
        {/* Prominent Focus Timer Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-xl border transition select-none shadow-xs ${
            isRunning
              ? "bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20"
              : "bg-white dark:bg-[#141312] border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-700"
          }`}
        >
          {/* Status Indicator */}
          {isRunning ? (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          ) : (
            <Timer className="w-3.5 h-3.5 text-stone-400" />
          )}

          {/* Time & Mode Display (Click to open modal) */}
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 cursor-pointer font-mono font-bold text-xs tracking-tight hover:opacity-80 transition"
            title="Click to change focus mode or configure"
          >
            <span className="hidden sm:inline text-[10px] uppercase font-sans font-semibold tracking-wider text-stone-500 dark:text-stone-400">
              {mode === "deepwork" ? "Deep Work" : mode === "shortbreak" ? "Break" : "Focus"}
            </span>
            <span className={isRunning ? "text-amber-600 dark:text-amber-300" : ""}>
              {timeFormatted}
            </span>
          </button>

          {/* Quick Play/Pause Button */}
          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className={`p-1 rounded-lg transition cursor-pointer ${
              isRunning
                ? "text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
                : "text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800/80"
            }`}
            title={isRunning ? "Pause focus timer" : "Start focus timer"}
          >
            {isRunning ? (
              <Pause className="w-3 h-3 fill-current" />
            ) : (
              <Play className="w-3 h-3 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Quick Capture Button */}
        <button
          onClick={() => setQuickCaptureOpen(true)}
          title="Quick Capture (Ctrl+N)"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 text-xs font-medium shadow-2xs transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>

        {/* Theme Mode Toggle Button */}
        <button
          onClick={cycleTheme}
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
          className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800/60 transition-colors"
        >
          {theme === "light" && <Sun className="w-3.5 h-3.5 text-amber-600" />}
          {theme === "dark" && <Moon className="w-3.5 h-3.5 text-stone-300" />}
          {theme === "system" && <Laptop className="w-3.5 h-3.5 text-stone-400" />}
        </button>

        {/* Window Controls (Frameless Header: Minimize, Maximize/Restore, Close) */}
        {isTauri && (
          <div className="flex items-center ml-1 pl-2 border-l border-stone-200 dark:border-stone-800 gap-0.5">
            <button
              onClick={handleMinimize}
              title="Minimize"
              className="p-1.5 rounded-md text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToggleMaximize}
              title={isMaximized ? "Restore Window" : "Maximize Window"}
              className="p-1.5 rounded-md text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 transition cursor-pointer"
            >
              {isMaximized ? (
                <Copy className="w-3 h-3 rotate-180" />
              ) : (
                <Square className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={handleClose}
              title="Close (Docks to Tray)"
              className="p-1.5 rounded-md text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
