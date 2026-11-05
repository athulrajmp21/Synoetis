import { invoke } from "@tauri-apps/api/core";
import { SystemInfo, DashboardStats } from "@/types/system";
import { AppSetting } from "@/types/settings";

export const systemService = {
  async getSystemInfo(): Promise<SystemInfo> {
    try {
      return await invoke<SystemInfo>("get_system_info");
    } catch (error) {
      console.error("Failed to load system info:", error);
      throw error;
    }
  },
};

export const settingsService = {
  async getSetting(key: string): Promise<string | null> {
    try {
      return await invoke<string | null>("get_setting", { key });
    } catch (error) {
      console.error(`Failed to get setting ${key}:`, error);
      return null;
    }
  },

  async setSetting(key: string, value: string): Promise<void> {
    try {
      await invoke("set_setting", { key, value });
    } catch (error) {
      console.error(`Failed to set setting ${key}:`, error);
      throw error;
    }
  },

  async getAllSettings(): Promise<AppSetting[]> {
    try {
      return await invoke<AppSetting[]>("get_all_settings");
    } catch (error) {
      console.error("Failed to fetch all settings:", error);
      return [];
    }
  },
};

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await invoke<DashboardStats>("get_dashboard_stats");
    } catch (error) {
      console.error("Failed to load dashboard statistics:", error);
      // Fallback safe default
      return {
        pending_tasks_count: 0,
        active_projects_count: 0,
        dsa_solved_count: 0,
        current_semester: "Semester 4 (Spring)",
        weekly_study_hours: 0,
        active_goals_count: 0,
        upcoming_assessments_count: 0,
      };
    }
  },
};
