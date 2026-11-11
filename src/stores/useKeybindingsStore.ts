import { create } from "zustand";
import { settingsService } from "@/services/api";

export interface KeybindingDef {
  id: string;
  label: string;
  description: string;
  category: "global" | "navigation";
  defaultBinding: string;
  binding: string;
  route?: string;
}

export const DEFAULT_KEYBINDINGS: Record<string, KeybindingDef> = {
  // Global Actions
  omnisearch: {
    id: "omnisearch",
    label: "Global Omnisearch",
    description: "Open universal search across local database",
    category: "global",
    defaultBinding: "Ctrl+K",
    binding: "Ctrl+K",
  },
  quick_capture: {
    id: "quick_capture",
    label: "Quick Capture",
    description: "Instantly create a new task or quick note",
    category: "global",
    defaultBinding: "Ctrl+N",
    binding: "Ctrl+N",
  },
  toggle_sidebar: {
    id: "toggle_sidebar",
    label: "Toggle Sidebar",
    description: "Collapse or expand the navigation sidebar",
    category: "global",
    defaultBinding: "Ctrl+B",
    binding: "Ctrl+B",
  },
  toggle_focus_timer: {
    id: "toggle_focus_timer",
    label: "Toggle Focus Timer",
    description: "Quick start or pause the background focus timer",
    category: "global",
    defaultBinding: "Ctrl+Shift+F",
    binding: "Ctrl+Shift+F",
  },

  // Navigation Shortcuts
  nav_dashboard: {
    id: "nav_dashboard",
    label: "Dashboard",
    description: "Go to Command Center Dashboard",
    category: "navigation",
    defaultBinding: "G D",
    binding: "G D",
    route: "/",
  },
  nav_tasks: {
    id: "nav_tasks",
    label: "My Tasks",
    description: "Go to Tasks & Priorities manager",
    category: "navigation",
    defaultBinding: "G T",
    binding: "G T",
    route: "/tasks",
  },
  nav_calendar: {
    id: "nav_calendar",
    label: "Calendar",
    description: "Go to Unified Calendar & Deadlines",
    category: "navigation",
    defaultBinding: "G C",
    binding: "G C",
    route: "/calendar",
  },
  nav_study: {
    id: "nav_study",
    label: "Study Studio",
    description: "Go to Split-View Reading & Note Pad",
    category: "navigation",
    defaultBinding: "G R",
    binding: "G R",
    route: "/study",
  },
  nav_knowledge: {
    id: "nav_knowledge",
    label: "Knowledge Hub",
    description: "Go to Knowledge Hub & Notes",
    category: "navigation",
    defaultBinding: "G K",
    binding: "G K",
    route: "/knowledge",
  },
  nav_resources: {
    id: "nav_resources",
    label: "Technical Library",
    description: "Go to Books, Research Papers & Docs",
    category: "navigation",
    defaultBinding: "G L",
    binding: "G L",
    route: "/resources",
  },
  nav_academic: {
    id: "nav_academic",
    label: "Academic OS",
    description: "Go to Semesters, Courses & Exams",
    category: "navigation",
    defaultBinding: "G A",
    binding: "G A",
    route: "/academic",
  },
  nav_dsa: {
    id: "nav_dsa",
    label: "DSA Tracker",
    description: "Go to LeetCode & Algorithms Tracker",
    category: "navigation",
    defaultBinding: "G S",
    binding: "G S",
    route: "/dsa",
  },
  nav_career: {
    id: "nav_career",
    label: "Career OS",
    description: "Go to Job Applications & Interview Vault",
    category: "navigation",
    defaultBinding: "G J",
    binding: "G J",
    route: "/career",
  },
  nav_projects: {
    id: "nav_projects",
    label: "Engineering Projects",
    description: "Go to Projects & Tech Stacks",
    category: "navigation",
    defaultBinding: "G P",
    binding: "G P",
    route: "/projects",
  },
  nav_snippets: {
    id: "nav_snippets",
    label: "Snippet Vault",
    description: "Go to Developer CLI Cheat Sheets & Code Vault",
    category: "navigation",
    defaultBinding: "G V",
    binding: "G V",
    route: "/snippets",
  },
  nav_goals: {
    id: "nav_goals",
    label: "Goals & Milestones",
    description: "Go to OKRs & Targets",
    category: "navigation",
    defaultBinding: "G G",
    binding: "G G",
    route: "/goals",
  },
  nav_habits: {
    id: "nav_habits",
    label: "Habits & Discipline",
    description: "Go to Habit Tracker & Streaks",
    category: "navigation",
    defaultBinding: "G H",
    binding: "G H",
    route: "/habits",
  },
  nav_analytics: {
    id: "nav_analytics",
    label: "Analytics & Velocity",
    description: "Go to Activity Heatmap & Metrics",
    category: "navigation",
    defaultBinding: "G Y",
    binding: "G Y",
    route: "/analytics",
  },
  nav_settings: {
    id: "nav_settings",
    label: "Settings",
    description: "Go to App Preferences & Keybindings",
    category: "navigation",
    defaultBinding: "Ctrl+,",
    binding: "Ctrl+,",
    route: "/settings",
  },
  nav_backup: {
    id: "nav_backup",
    label: "Backup & Restore",
    description: "Go to SQLite Snapshots & JSON Archive",
    category: "navigation",
    defaultBinding: "G B",
    binding: "G B",
    route: "/backup",
  },
};

export function normalizeKeyboardEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");

  let key = e.key;
  if (key === " " || key === "Spacebar") key = "Space";
  else if (key === ",") key = ",";
  else if (key === ".") key = ".";
  else if (key === "/") key = "/";
  else if (key.length === 1) key = key.toUpperCase();

  // Don't format lone modifier keys
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
    return parts.join("+");
  }

  parts.push(key);
  return parts.join("+");
}

interface KeybindingsState {
  keybindings: Record<string, KeybindingDef>;
  pendingSequence: string | null;
  sequenceTimeoutRef: ReturnType<typeof setTimeout> | null;

  initKeybindings: () => Promise<void>;
  setKeybinding: (id: string, newBinding: string) => Promise<boolean>;
  resetKeybinding: (id: string) => Promise<void>;
  resetAll: () => Promise<void>;
  matches: (e: KeyboardEvent, actionId: string) => boolean;
  findConflict: (binding: string, excludeId?: string) => KeybindingDef | undefined;
}

export const useKeybindingsStore = create<KeybindingsState>((set, get) => ({
  keybindings: { ...DEFAULT_KEYBINDINGS },
  pendingSequence: null,
  sequenceTimeoutRef: null,

  initKeybindings: async () => {
    try {
      const saved = await settingsService.getSetting("keybindings_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        const merged = { ...DEFAULT_KEYBINDINGS };
        for (const [id, customBinding] of Object.entries(parsed)) {
          if (merged[id] && typeof customBinding === "string") {
            merged[id] = { ...merged[id], binding: customBinding };
          }
        }
        set({ keybindings: merged });
      }
    } catch (e) {
      console.warn("Failed to load keybindings configuration:", e);
    }
  },

  setKeybinding: async (id: string, newBinding: string) => {
    const current = get().keybindings;
    if (!current[id]) return false;

    const updated = {
      ...current,
      [id]: { ...current[id], binding: newBinding.trim() },
    };

    set({ keybindings: updated });

    try {
      // Extract simplified map { [id]: binding } for persistence
      const persistMap: Record<string, string> = {};
      for (const [k, def] of Object.entries(updated)) {
        if (def.binding !== def.defaultBinding) {
          persistMap[k] = def.binding;
        }
      }
      await settingsService.setSetting(
        "keybindings_config",
        JSON.stringify(persistMap)
      );
      return true;
    } catch (e) {
      console.error("Failed to persist keybindings:", e);
      return false;
    }
  },

  resetKeybinding: async (id: string) => {
    const current = get().keybindings;
    if (!current[id]) return;

    const updated = {
      ...current,
      [id]: { ...current[id], binding: current[id].defaultBinding },
    };

    set({ keybindings: updated });

    try {
      const persistMap: Record<string, string> = {};
      for (const [k, def] of Object.entries(updated)) {
        if (def.binding !== def.defaultBinding) {
          persistMap[k] = def.binding;
        }
      }
      await settingsService.setSetting(
        "keybindings_config",
        JSON.stringify(persistMap)
      );
    } catch (e) {
      console.error("Failed to reset keybinding:", e);
    }
  },

  resetAll: async () => {
    const reset = { ...DEFAULT_KEYBINDINGS };
    set({ keybindings: reset });
    try {
      await settingsService.setSetting("keybindings_config", "{}");
    } catch (e) {
      console.error("Failed to reset all keybindings:", e);
    }
  },

  matches: (e: KeyboardEvent, actionId: string) => {
    const def = get().keybindings[actionId];
    if (!def) return false;

    const target = def.binding.trim();
    // Normalize target format
    const currentNormalized = normalizeKeyboardEvent(e);

    // If it's a modifier combination (e.g. "Ctrl+K" or "Ctrl+Shift+F")
    if (target.includes("+")) {
      return (
        currentNormalized.toLowerCase() === target.toLowerCase()
      );
    }

    // Single key (e.g. F1-F12)
    if (e.key.toLowerCase() === target.toLowerCase() && !e.ctrlKey && !e.altKey && !e.metaKey) {
      return true;
    }

    return false;
  },

  findConflict: (binding: string, excludeId?: string) => {
    const b = binding.trim().toLowerCase();
    for (const [id, def] of Object.entries(get().keybindings)) {
      if (id !== excludeId && def.binding.trim().toLowerCase() === b) {
        return def;
      }
    }
    return undefined;
  },
}));
