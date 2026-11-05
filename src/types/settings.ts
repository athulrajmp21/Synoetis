export type ThemeMode = "light" | "dark" | "system";

export interface AppSetting {
  key: string;
  value: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  userName: string;
  accentColor: string;
}
