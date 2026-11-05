import React, { useEffect, useState } from "react";
import {
  Settings,
  Database,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  HardDrive,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useThemeStore } from "@/stores/useThemeStore";
import { systemService, settingsService } from "@/services/api";
import { SystemInfo } from "@/types/system";
import { AppSetting, ThemeMode } from "@/types/settings";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [settingsList, setSettingsList] = useState<AppSetting[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [sys, all] = await Promise.all([
        systemService.getSystemInfo(),
        settingsService.getAllSettings(),
      ]);
      setSystemInfo(sys);
      setSettingsList(all);
    } catch (err) {
      console.error("Failed to load settings data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleThemeChange = async (mode: ThemeMode) => {
    await setTheme(mode);
    loadData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Preferences & Diagnostics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage theme, database persistence, and system configuration.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Reload Diagnostics
        </Button>
      </div>

      {/* Theme Selection */}
      <Card>
        <div className="pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Interface Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select your preferred desktop appearance. Choice is persisted to SQLite.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { mode: "light" as ThemeMode, label: "Light", icon: Sun, desc: "Crisp daytime contrast" },
            { mode: "dark" as ThemeMode, label: "Dark", icon: Moon, desc: "High-contrast nighttime palette" },
            { mode: "system" as ThemeMode, label: "System", icon: Laptop, desc: "Follows Windows OS theme" },
          ].map(({ mode, label, icon: Icon, desc }) => (
            <button
              key={mode}
              onClick={() => handleThemeChange(mode)}
              className={`p-4 rounded-xl border text-left transition-all ${
                theme === mode
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-600/50"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`w-5 h-5 ${
                    theme === mode ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                  }`}
                />
                {theme === mode && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                {label}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {desc}
              </p>
            </button>
          ))}
        </div>
      </Card>

      {/* Database Diagnostics */}
      <Card>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              SQLite Storage Diagnostics
            </h2>
          </div>
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Active
          </Badge>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
              Database Path
            </span>
            <span className="text-slate-700 dark:text-slate-200 break-all select-text">
              {systemInfo?.db_path || "Loading..."}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Schema Tables
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                {systemInfo?.total_tables ?? "--"} Tables
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Host OS
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold text-sm capitalize">
                {systemInfo?.os ?? "--"}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                App Version
              </span>
              <span className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                v{systemInfo?.app_version ?? "--"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Persisted Settings Key-Value Table */}
      <Card>
        <div className="pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Persisted Settings Registry
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct entries stored in SQLite <code>settings</code> table.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {settingsList.length} keys
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-2 font-semibold">Key</th>
                <th className="px-4 py-2 font-semibold">Value</th>
                <th className="px-4 py-2 font-semibold">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {settingsList.map((row) => (
                <tr
                  key={row.key}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30"
                >
                  <td className="px-4 py-2.5 font-semibold text-indigo-600 dark:text-indigo-400">
                    {row.key}
                  </td>
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200">
                    {row.value}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 text-[11px]">
                    {row.updated_at}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
