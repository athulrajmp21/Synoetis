import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandSearchModal } from "./CommandSearchModal";
import { QuickCaptureModal } from "./QuickCaptureModal";
import { useThemeStore } from "@/stores/useThemeStore";
import { useNavigationStore } from "@/stores/useNavigationStore";

export const AppLayout: React.FC = () => {
  const { initTheme } = useThemeStore();
  const { initNavigation, toggleSidebar, setQuickCaptureOpen } = useNavigationStore();

  useEffect(() => {
    initTheme();
    initNavigation();

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Ctrl+B: Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      // Ctrl+N: Quick Capture
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setQuickCaptureOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [initTheme, initNavigation, toggleSidebar, setQuickCaptureOpen]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <CommandSearchModal />
      <QuickCaptureModal />
    </div>
  );
};
