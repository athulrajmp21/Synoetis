import { create } from "zustand";
import { settingsService } from "@/services/api";

interface NavigationState {
  isSidebarCollapsed: boolean;
  isSearchOpen: boolean;
  isQuickCaptureOpen: boolean;
  toggleSidebar: () => Promise<void>;
  setSidebarCollapsed: (collapsed: boolean) => Promise<void>;
  setSearchOpen: (open: boolean) => void;
  setQuickCaptureOpen: (open: boolean) => void;
  initNavigation: () => Promise<void>;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  isSidebarCollapsed: false,
  isSearchOpen: false,
  isQuickCaptureOpen: false,

  toggleSidebar: async () => {
    const next = !get().isSidebarCollapsed;
    set({ isSidebarCollapsed: next });
    try {
      await settingsService.setSetting("sidebar_collapsed", String(next));
    } catch (err) {
      console.error("Failed to persist sidebar state:", err);
    }
  },

  setSidebarCollapsed: async (collapsed: boolean) => {
    set({ isSidebarCollapsed: collapsed });
    try {
      await settingsService.setSetting("sidebar_collapsed", String(collapsed));
    } catch (err) {
      console.error("Failed to persist sidebar state:", err);
    }
  },

  setSearchOpen: (open: boolean) => set({ isSearchOpen: open }),
  setQuickCaptureOpen: (open: boolean) => set({ isQuickCaptureOpen: open }),

  initNavigation: async () => {
    try {
      const saved = await settingsService.getSetting("sidebar_collapsed");
      if (saved !== null) {
        set({ isSidebarCollapsed: saved === "true" });
      }
    } catch (err) {
      console.warn("Could not load sidebar preferences:", err);
    }
  },
}));
