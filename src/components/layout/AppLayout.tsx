import React, { useEffect, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandSearchModal } from "./CommandSearchModal";
import { QuickCaptureModal } from "./QuickCaptureModal";
import { FocusTimerModal } from "@/components/focus/FocusTimerModal";
import { UpdateModal } from "@/components/update/UpdateModal";
import { GlobalContextMenu } from "./GlobalContextMenu";
import { useThemeStore } from "@/stores/useThemeStore";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useFocusTimerStore } from "@/stores/useFocusTimerStore";
import { useKeybindingsStore } from "@/stores/useKeybindingsStore";
import { useUpdateStore } from "@/stores/useUpdateStore";

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const { initTheme } = useThemeStore();
  const { initNavigation, toggleSidebar, setQuickCaptureOpen, setSearchOpen } =
    useNavigationStore();
  const { tick, isRunning, initSync, startTimer, pauseTimer } =
    useFocusTimerStore();
  const { initKeybindings, matches, keybindings } = useKeybindingsStore();

  const leaderKeyRef = useRef<string | null>(null);
  const leaderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync active background timer on load
  useEffect(() => {
    initSync();
  }, [initSync]);

  // Focus timer tick loop
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  useEffect(() => {
    initTheme();
    initNavigation();
    initKeybindings();

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      // 1. Modifiers shortcuts (Ctrl/Alt combinations work even if focused in some places)
      if (matches(e, "omnisearch")) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (matches(e, "quick_capture")) {
        e.preventDefault();
        setQuickCaptureOpen(true);
        return;
      }
      if (matches(e, "toggle_sidebar")) {
        e.preventDefault();
        toggleSidebar();
        return;
      }
      if (matches(e, "toggle_focus_timer")) {
        e.preventDefault();
        if (isRunning) pauseTimer();
        else startTimer();
        return;
      }

      // Check single-key combination for nav_settings (Ctrl+,)
      if (matches(e, "nav_settings")) {
        e.preventDefault();
        navigate("/settings");
        return;
      }

      // 2. Sequential Navigation Chords (e.g. "G D", "G T", "G R")
      // Only active when NOT typing in an input or text field
      if (isInput) return;

      const keyUpper = e.key.toUpperCase();

      if (leaderKeyRef.current) {
        const chord = `${leaderKeyRef.current} ${keyUpper}`;
        leaderKeyRef.current = null;
        if (leaderTimeoutRef.current) clearTimeout(leaderTimeoutRef.current);

        // Find if chord matches any navigation keybinding
        const found = Object.values(keybindings).find(
          (k) => k.category === "navigation" && k.binding.toUpperCase() === chord
        );

        if (found && found.route) {
          e.preventDefault();
          navigate(found.route);
        }
        return;
      }

      // If user presses "G" without modifiers, start leader chord
      if (keyUpper === "G" && !e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        leaderKeyRef.current = "G";
        if (leaderTimeoutRef.current) clearTimeout(leaderTimeoutRef.current);
        leaderTimeoutRef.current = setTimeout(() => {
          leaderKeyRef.current = null;
        }, 1200);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
      if (leaderTimeoutRef.current) clearTimeout(leaderTimeoutRef.current);
    };
  }, [
    initTheme,
    initNavigation,
    initKeybindings,
    toggleSidebar,
    setQuickCaptureOpen,
    setSearchOpen,
    matches,
    keybindings,
    isRunning,
    startTimer,
    pauseTimer,
    navigate,
  ]);

  // Background check for updates after initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      useUpdateStore.getState().checkForUpdates(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF8F5] dark:bg-[#0C0B0A] text-stone-900 dark:text-stone-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-5 bg-[#FAF8F5] dark:bg-[#0C0B0A]">
          <Outlet />
        </main>
      </div>

      {/* Global Modals & Context Menu */}
      <CommandSearchModal />
      <QuickCaptureModal />
      <FocusTimerModal />
      <UpdateModal />
      <GlobalContextMenu />
    </div>
  );
};
