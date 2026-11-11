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
  GraduationCap,
  Award,
  BookOpen,
  Check,
  Bell,
  Volume2,
  Power,
  Shield,
  Layers,
  Keyboard,
  RotateCcw,
  Edit3,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useThemeStore } from "@/stores/useThemeStore";
import { useKeybindingsStore, normalizeKeyboardEvent, KeybindingDef } from "@/stores/useKeybindingsStore";
import { systemService, settingsService, academicService, focusService } from "@/services/api";
import { SystemInfo } from "@/types/system";
import { AppSetting, ThemeMode } from "@/types/settings";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [settingsList, setSettingsList] = useState<AppSetting[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Desktop & Tray Preferences
  const [autostartEnabled, setAutostartEnabled] = useState(false);
  const [closeToTray, setCloseToTray] = useState(true);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Academic Settings Form State
  const [degree, setDegree] = useState("");
  const [targetGpa, setTargetGpa] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [academicSavedMessage, setAcademicSavedMessage] = useState(false);
  const [isSavingAcademic, setIsSavingAcademic] = useState(false);

  // Keybindings State
  const { keybindings, setKeybinding, resetKeybinding, resetAll, findConflict } =
    useKeybindingsStore();
  const [recordingActionId, setRecordingActionId] = useState<string | null>(null);
  const [chordBuffer, setChordBuffer] = useState<string | null>(null);
  const [keybindingFeedback, setKeybindingFeedback] = useState<string | null>(null);
  const [keybindingCategory, setKeybindingCategory] = useState<
    "all" | "global" | "navigation"
  >("all");

  useEffect(() => {
    if (!recordingActionId) {
      setChordBuffer(null);
      return;
    }

    const handleRecordKey = async (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === "Escape") {
        setRecordingActionId(null);
        setChordBuffer(null);
        return;
      }

      // Check modifier combinations (e.g. Ctrl+K, Ctrl+Shift+F, Alt+Space)
      const combo = normalizeKeyboardEvent(e);
      if (
        combo.includes("+") &&
        !["Control", "Alt", "Shift", "Meta"].includes(e.key)
      ) {
        const conflict = findConflict(combo, recordingActionId);
        await setKeybinding(recordingActionId, combo);
        if (conflict) {
          setKeybindingFeedback(
            `Updated! (Replaced previous binding for ${conflict.label})`
          );
        } else {
          setKeybindingFeedback(`Saved shortcut: ${combo}`);
        }
        setRecordingActionId(null);
        setChordBuffer(null);
        setTimeout(() => setKeybindingFeedback(null), 3500);
        return;
      }

      // Single key or chord sequence (e.g. "G D")
      if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        const key = e.key.toUpperCase();
        if (!chordBuffer) {
          // Function key like F1-F12
          if (/^F\d+$/.test(key)) {
            await setKeybinding(recordingActionId, key);
            setKeybindingFeedback(`Saved shortcut: ${key}`);
            setRecordingActionId(null);
            setTimeout(() => setKeybindingFeedback(null), 3500);
            return;
          }
          // Start of chord (e.g. user pressed 'G')
          setChordBuffer(key);
        } else {
          // Second key of chord (e.g. user pressed 'D' -> 'G D')
          const chord = `${chordBuffer} ${key}`;
          const conflict = findConflict(chord, recordingActionId);
          await setKeybinding(recordingActionId, chord);
          if (conflict) {
            setKeybindingFeedback(
              `Updated! (Replaced previous binding for ${conflict.label})`
            );
          } else {
            setKeybindingFeedback(`Saved chord: ${chord}`);
          }
          setRecordingActionId(null);
          setChordBuffer(null);
          setTimeout(() => setKeybindingFeedback(null), 3500);
        }
      }
    };

    window.addEventListener("keydown", handleRecordKey, true);
    return () => window.removeEventListener("keydown", handleRecordKey, true);
  }, [recordingActionId, chordBuffer, setKeybinding, findConflict]);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [sys, all, deg, gpa, activeSem, autostart, traySetting] = await Promise.all([
        systemService.getSystemInfo(),
        settingsService.getAllSettings(),
        settingsService.getSetting("academic_degree"),
        settingsService.getSetting("academic_target_gpa"),
        settingsService.getSetting("academic_active_semester"),
        systemService.getAutostartEnabled(),
        settingsService.getSetting("minimize_to_tray_on_close"),
      ]);
      setSystemInfo(sys);
      setSettingsList(all);
      if (deg) setDegree(deg);
      if (gpa) setTargetGpa(gpa);
      if (activeSem) setSelectedSemester(parseInt(activeSem, 10) || 1);
      setAutostartEnabled(autostart);
      setCloseToTray(traySetting !== "false");
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

  const handleToggleAutostart = async () => {
    const nextVal = !autostartEnabled;
    setAutostartEnabled(nextVal);
    try {
      await systemService.setAutostartEnabled(nextVal);
    } catch (err) {
      console.error("Failed to set autostart:", err);
      setAutostartEnabled(!nextVal);
    }
  };

  const handleToggleCloseToTray = async () => {
    const nextVal = !closeToTray;
    setCloseToTray(nextVal);
    try {
      await settingsService.setSetting("minimize_to_tray_on_close", nextVal ? "true" : "false");
      await systemService.setTrayVisible(nextVal);
    } catch (err) {
      console.error("Failed to set minimize_to_tray_on_close:", err);
      setCloseToTray(!nextVal);
    }
  };

  const handleTestNotification = async () => {
    await focusService.sendDesktopNotification(
      "Synoetis Notification Test 🎯",
      "Windows toast notifications and background chimes are working perfectly!"
    );
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const handleSaveAcademic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAcademic(true);
    try {
      const gpa = targetGpa ? parseFloat(targetGpa) : undefined;
      await academicService.setActiveSemester(selectedSemester, gpa, degree.trim() || undefined);
      if (degree.trim()) {
        await settingsService.setSetting("academic_degree", degree.trim());
      }
      if (targetGpa.trim()) {
        await settingsService.setSetting("academic_target_gpa", targetGpa.trim());
      }
      await loadData();
      setAcademicSavedMessage(true);
      setTimeout(() => setAcademicSavedMessage(false), 3000);
    } catch (err) {
      console.error("Failed to save academic settings:", err);
    } finally {
      setIsSavingAcademic(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300/60 dark:border-stone-700/60">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Preferences & Configuration
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Manage system tray docking, startup boot, audio notifications, and academic profile.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={isRefreshing}
          className="text-xs border-stone-200 dark:border-stone-800"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Reload
        </Button>
      </div>

      {/* SECTION 1: SYSTEM TRAY, STARTUP & BACKGROUND FOCUS MODE */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              System Tray & Background Mode
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">
            Active
          </span>
        </div>

        <div className="divide-y divide-stone-200/60 dark:divide-stone-800/60 text-xs">
          {/* Autostart Toggle */}
          <div
            onClick={handleToggleAutostart}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggleAutostart();
              }
            }}
            className="py-3 flex items-center justify-between gap-4 cursor-pointer select-none rounded-xl px-2.5 -mx-2.5 transition-colors hover:bg-stone-200/50 dark:hover:bg-stone-800/40"
          >
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Launch on Windows Startup</span>
                {autostartEnabled ? (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    ● Enabled
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                    ○ Disabled
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Automatically launch Synoetis in the background / system tray when your computer boots up.
              </p>
            </div>
            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition shrink-0 ${
                autostartEnabled ? "bg-amber-600" : "bg-stone-300 dark:bg-stone-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  autostartEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          {/* Minimize to Tray on Close Toggle */}
          <div
            onClick={handleToggleCloseToTray}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleToggleCloseToTray();
              }
            }}
            className="py-3 flex items-center justify-between gap-4 cursor-pointer select-none rounded-xl px-2.5 -mx-2.5 transition-colors hover:bg-stone-200/50 dark:hover:bg-stone-800/40"
          >
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Minimize to System Tray on Close</span>
                {closeToTray ? (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                    ● Dock to Tray
                  </span>
                ) : (
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                    ○ Exit Completely
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Clicking the window [X] docks Synoetis into the taskbar notification tray so focus timers continue running.
              </p>
            </div>
            <div
              className={`w-11 h-6 flex items-center rounded-full p-1 transition shrink-0 ${
                closeToTray ? "bg-amber-600" : "bg-stone-300 dark:bg-stone-700"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  closeToTray ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          {/* Test Toast Notifications & Sound Chimes */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-stone-500" />
                <span>Windows Toast Notifications & Audio Chimes</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Plays a gentle chime and pops a native Windows notification when deep work sessions finish.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestNotification}
              className="text-xs border-stone-200 dark:border-stone-800 self-start sm:self-auto cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 mr-1 text-amber-500" />
              {testNotificationSent ? "Notification Sent!" : "Test Toast & Chime"}
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 2: THEME SELECTION */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
        <div className="pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Interface Appearance
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Select your preferred desktop appearance. Choice is persisted to SQLite.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              mode: "light" as ThemeMode,
              label: "Light (Warm Nude)",
              icon: Sun,
              desc: "Warm neutral stone & nude aesthetic",
            },
            {
              mode: "dark" as ThemeMode,
              label: "Dark (Warm Obsidian)",
              icon: Moon,
              desc: "Deep warm graphite & obsidian contrast",
            },
            {
              mode: "system" as ThemeMode,
              label: "System Sync",
              icon: Laptop,
              desc: "Follows Windows OS color scheme",
            },
          ].map(({ mode, label, icon: Icon, desc }) => (
            <button
              key={mode}
              onClick={() => handleThemeChange(mode)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                theme === mode
                  ? "border-stone-900 bg-stone-100/90 dark:border-stone-100 dark:bg-stone-800/60 shadow-xs ring-1 ring-stone-900/10 dark:ring-stone-100/10"
                  : "border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] hover:border-stone-300 dark:hover:border-stone-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`w-5 h-5 ${
                    theme === mode
                      ? "text-stone-900 dark:text-stone-100"
                      : "text-stone-400 dark:text-stone-500"
                  }`}
                />
                {theme === mode && (
                  <CheckCircle2 className="w-4 h-4 text-stone-900 dark:text-stone-100" />
                )}
              </div>
              <div className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                {label}
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                {desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 3: KEYBOARD SHORTCUTS & KEYBINDINGS */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Keyboard Shortcuts & Keybindings
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Customize global hotkeys and fast sequential navigation chords. Saved to SQLite and active immediately.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {keybindingFeedback && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in">
                {keybindingFeedback}
              </span>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={resetAll}
              className="text-xs border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 cursor-pointer"
              title="Reset all shortcuts to factory defaults"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset All to Defaults
            </Button>
          </div>
        </div>

        {/* Filter Tabs for Keybindings */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setKeybindingCategory("all")}
            className={`px-3 py-1 text-xs rounded-xl font-medium transition cursor-pointer ${
              keybindingCategory === "all"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold"
                : "bg-white dark:bg-[#0C0B0A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300"
            }`}
          >
            All Shortcuts ({Object.keys(keybindings).length})
          </button>
          <button
            type="button"
            onClick={() => setKeybindingCategory("global")}
            className={`px-3 py-1 text-xs rounded-xl font-medium transition cursor-pointer ${
              keybindingCategory === "global"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold"
                : "bg-white dark:bg-[#0C0B0A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300"
            }`}
          >
            Global Hotkeys (4)
          </button>
          <button
            type="button"
            onClick={() => setKeybindingCategory("navigation")}
            className={`px-3 py-1 text-xs rounded-xl font-medium transition cursor-pointer ${
              keybindingCategory === "navigation"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-semibold"
                : "bg-white dark:bg-[#0C0B0A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300"
            }`}
          >
            Navigation Chords (14)
          </button>
        </div>

        {/* Shortcuts List Grid */}
        <div className="space-y-2">
          {Object.values(keybindings)
            .filter((item) =>
              keybindingCategory === "all" ? true : item.category === keybindingCategory
            )
            .map((item) => {
              const isRecording = recordingActionId === item.id;
              const isCustom = item.binding !== item.defaultBinding;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                    isRecording
                      ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 ring-2 ring-amber-500/20"
                      : "bg-white dark:bg-[#0C0B0A] border-stone-200/80 dark:border-stone-800/80"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-stone-100 dark:bg-stone-800/90 text-stone-500 uppercase">
                        {item.category}
                      </span>
                      {isCustom && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {item.description}
                    </p>
                  </div>

                  {/* Right: Keycap Badge & Edit Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isRecording ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-3 py-1 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 animate-pulse font-semibold">
                          {chordBuffer ? `Press second key: ${chordBuffer} + ?` : "Press new shortcut keys..."}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingActionId(null);
                            setChordBuffer(null);
                          }}
                          className="px-2 py-1 text-[11px] rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer"
                        >
                          Cancel (Esc)
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {/* Keycaps display */}
                        <div
                          onClick={() => setRecordingActionId(item.id)}
                          className="cursor-pointer group flex items-center gap-1"
                          title="Click to record new keybinding"
                        >
                          {item.binding.includes(" ") ? (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              {item.binding.split(" ").map((k, idx, arr) => (
                                <React.Fragment key={idx}>
                                  <kbd className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 font-semibold shadow-2xs group-hover:border-amber-500 transition">
                                    {k}
                                  </kbd>
                                  {idx < arr.length - 1 && (
                                    <span className="text-[10px] text-stone-400">then</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 font-mono text-xs">
                              {item.binding.split("+").map((k, idx, arr) => (
                                <React.Fragment key={idx}>
                                  <kbd className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 font-semibold shadow-2xs group-hover:border-amber-500 transition">
                                    {k}
                                  </kbd>
                                  {idx < arr.length - 1 && (
                                    <span className="text-[10px] text-stone-400">+</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Edit Action Button */}
                        <button
                          type="button"
                          onClick={() => setRecordingActionId(item.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                          title="Change shortcut"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset individual button if customized */}
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => resetKeybinding(item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
                            title={`Reset to default (${item.defaultBinding})`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* SECTION 4: ACADEMIC PROFILE SETTINGS */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Academic Profile & Current Semester
            </h2>
          </div>
          {academicSavedMessage && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="w-3.5 h-3.5" /> Saved to Database
            </span>
          )}
        </div>

        <form onSubmit={handleSaveAcademic} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Degree & Major
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. B.Tech Computer Science"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#0C0B0A] border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Target Semester GPA / CGPA
              </label>
              <div className="relative">
                <Award className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  placeholder="e.g. 9.0"
                  value={targetGpa}
                  onChange={(e) => setTargetGpa(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#0C0B0A] border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Active Enrolled Semester
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const isSelected = selectedSemester === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`py-2 px-1 rounded-xl text-xs font-medium border text-center transition cursor-pointer ${
                      isSelected
                        ? "bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-xs"
                        : "bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                    }`}
                  >
                    Sem {sem}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingAcademic}
              className="px-4 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-200 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isSavingAcademic ? "Saving..." : "Save Academic Profile"}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 5: LOCAL STORAGE DIAGNOSTICS */}
      <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              Local Storage Diagnostics
            </h2>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/70 dark:border-stone-800/70">
            <span className="text-stone-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
              SQLite Database Path
            </span>
            <span className="text-stone-700 dark:text-stone-300 break-all select-text font-mono text-[11px]">
              {systemInfo?.db_path || "Loading..."}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/70 dark:border-stone-800/70">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Schema Tables
              </span>
              <span className="text-stone-900 dark:text-stone-100 font-bold text-sm">
                {systemInfo?.total_tables ?? "--"} Tables
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/70 dark:border-stone-800/70">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                Host Operating System
              </span>
              <span className="text-stone-900 dark:text-stone-100 font-bold text-sm capitalize">
                {systemInfo?.os ?? "--"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/70 dark:border-stone-800/70">
              <span className="text-stone-400 block text-[10px] uppercase font-semibold tracking-wider mb-1">
                App Version
              </span>
              <span className="text-stone-900 dark:text-stone-100 font-bold text-sm">
                v{systemInfo?.app_version ?? "--"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
