import { invoke } from "@tauri-apps/api/core";
import { SystemInfo, DashboardStats } from "@/types/system";
import { AppSetting } from "@/types/settings";

function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export const systemService = {
  async getSystemInfo(): Promise<SystemInfo> {
    if (!isTauriEnvironment()) {
      return {
        app_version: "0.1.0",
        os: "Windows",
        db_path: "Local SQLite (lifeos.db)",
        total_tables: 20,
      };
    }
    try {
      return await invoke<SystemInfo>("get_system_info");
    } catch (error) {
      console.warn("Failed to load system info via Tauri, using fallback:", error);
      return {
        app_version: "0.1.0",
        os: "Windows",
        db_path: "Local SQLite (lifeos.db)",
        total_tables: 20,
      };
    }
  },
};

export const settingsService = {
  async getSetting(key: string): Promise<string | null> {
    if (!isTauriEnvironment()) {
      return localStorage.getItem(`lifeos_setting_${key}`);
    }
    try {
      return await invoke<string | null>("get_setting", { key });
    } catch (error) {
      console.warn(`Failed to get setting ${key}:`, error);
      return localStorage.getItem(`lifeos_setting_${key}`);
    }
  },

  async setSetting(key: string, value: string): Promise<void> {
    localStorage.setItem(`lifeos_setting_${key}`, value);
    if (!isTauriEnvironment()) return;
    try {
      await invoke("set_setting", { key, value });
    } catch (error) {
      console.warn(`Failed to set setting ${key}:`, error);
    }
  },

  async getAllSettings(): Promise<AppSetting[]> {
    if (!isTauriEnvironment()) {
      return [
        { key: "theme", value: "dark", updated_at: new Date().toISOString() },
        { key: "sidebar_collapsed", value: "false", updated_at: new Date().toISOString() },
      ];
    }
    try {
      return await invoke<AppSetting[]>("get_all_settings");
    } catch (error) {
      console.warn("Failed to fetch all settings:", error);
      return [];
    }
  },
};

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    if (!isTauriEnvironment()) {
      return {
        pending_tasks_count: 3,
        active_projects_count: 2,
        dsa_solved_count: 184,
        current_semester: "Semester 4 (Spring 2026)",
        weekly_study_hours: 22.5,
        active_goals_count: 4,
        upcoming_assessments_count: 3,
      };
    }
    try {
      return await invoke<DashboardStats>("get_dashboard_stats");
    } catch (error) {
      console.warn("Failed to load dashboard statistics:", error);
      return {
        pending_tasks_count: 3,
        active_projects_count: 2,
        dsa_solved_count: 184,
        current_semester: "Semester 4 (Spring 2026)",
        weekly_study_hours: 22.5,
        active_goals_count: 4,
        upcoming_assessments_count: 3,
      };
    }
  },
};
