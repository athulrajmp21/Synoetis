import { create } from "zustand";
import { ThemeMode } from "@/types/settings";
import { settingsService } from "@/services/api";

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => Promise<void>;
  initTheme: () => Promise<void>;
}

const getSystemTheme = (): "light" | "dark" => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

const applyThemeToDOM = (resolved: "light" | "dark") => {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolvedTheme: getSystemTheme(),

  setTheme: async (theme: ThemeMode) => {
    const resolved = theme === "system" ? getSystemTheme() : theme;
    applyThemeToDOM(resolved);
    set({ theme, resolvedTheme: resolved });

    try {
      await settingsService.setSetting("theme", theme);
    } catch (err) {
      console.error("Failed to persist theme setting:", err);
    }
  },

  initTheme: async () => {
    try {
      const savedTheme = (await settingsService.getSetting("theme")) as ThemeMode | null;
      const theme = savedTheme || "system";
      const resolved = theme === "system" ? getSystemTheme() : theme;
      applyThemeToDOM(resolved);
      set({ theme, resolvedTheme: resolved });

      // Listen for OS system theme changes
      if (window.matchMedia) {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        mediaQuery.addEventListener("change", (e) => {
          if (get().theme === "system") {
            const next = e.matches ? "dark" : "light";
            applyThemeToDOM(next);
            set({ resolvedTheme: next });
          }
        });
      }
    } catch (err) {
      console.warn("Could not load persisted theme from SQLite, defaulting to system:", err);
      const resolved = getSystemTheme();
      applyThemeToDOM(resolved);
    }
  },
}));
