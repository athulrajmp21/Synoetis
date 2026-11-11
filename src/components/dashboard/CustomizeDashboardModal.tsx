import React, { useState, useEffect } from "react";
import {
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Code2,
  GraduationCap,
  Timer,
  Flame,
  StickyNote,
  FolderGit2,
  Laptop,
  Target,
  BrainCircuit,
  Eye,
} from "lucide-react";
import {
  DashboardConfig,
  DashboardPreset,
  DEFAULT_DASHBOARD_CONFIG,
  PRESET_CONFIGS,
} from "@/types/dashboardConfig";
import { Button } from "@/components/ui/Button";

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DashboardConfig;
  onSave: (newConfig: DashboardConfig) => Promise<void>;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  config: initialConfig,
  onSave,
}) => {
  const [draftConfig, setDraftConfig] = useState<DashboardConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDraftConfig(initialConfig);
    }
  }, [isOpen, initialConfig]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: Exclude<DashboardPreset, "custom">) => {
    const presetConfig = PRESET_CONFIGS[preset];
    setDraftConfig({
      ...presetConfig,
    });
  };

  const handleToggleMetric = (key: keyof DashboardConfig["metrics"]) => {
    setDraftConfig((prev) => ({
      ...prev,
      preset: "custom",
      metrics: {
        ...prev.metrics,
        [key]: !prev.metrics[key],
      },
    }));
  };

  const handleToggleWidget = (key: keyof DashboardConfig["widgets"]) => {
    setDraftConfig((prev) => ({
      ...prev,
      preset: "custom",
      widgets: {
        ...prev.widgets,
        [key]: !prev.widgets[key],
      },
    }));
  };

  const handleTaglineChange = (text: string) => {
    setDraftConfig((prev) => ({
      ...prev,
      focus_tagline: text,
      preset: "custom",
    }));
  };

  const handleReset = () => {
    setDraftConfig(DEFAULT_DASHBOARD_CONFIG);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(draftConfig);
      onClose();
    } catch (err) {
      console.error("Failed to save dashboard preferences:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const activeMetricsCount = Object.values(draftConfig.metrics).filter(Boolean).length;
  const activeWidgetsCount = Object.values(draftConfig.widgets).filter(Boolean).length;

  const presetList: {
    id: Exclude<DashboardPreset, "custom">;
    title: string;
    description: string;
    icon: React.ElementType;
  }[] = [
    {
      id: "all",
      title: "All-Rounder",
      description: "Balanced overview of tasks, habits, academics & focus",
      icon: Sparkles,
    },
    {
      id: "dsa",
      title: "DSA & Placement",
      description: "LeetCode problem mastery, practice topics & deep focus",
      icon: Code2,
    },
    {
      id: "engineering",
      title: "Software Engineer",
      description: "Active repositories, architecture projects & deep work",
      icon: FolderGit2,
    },
    {
      id: "academic",
      title: "Academic & Student",
      description: "University courses, syllabus roadmap, GPA & study hours",
      icon: GraduationCap,
    },
    {
      id: "minimalist",
      title: "Deep Work Minimalist",
      description: "Pure distraction-free focus timer and top priorities",
      icon: BrainCircuit,
    },
  ];

  const suggestedTaglines = [
    "Placement Prep & LeetCode Grind",
    "Shipping Full-Stack Engineering Systems",
    "Cracking Semester Syllabus & High GPA",
    "Deep Work, Consistency & Zero Noise",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF8F5] dark:bg-[#141312] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-200/70 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                  Customise Dashboard
                </h2>
                {draftConfig.preset === "custom" ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                    Custom Profile
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/15 text-amber-800 dark:text-amber-300">
                    {presetList.find((p) => p.id === draftConfig.preset)?.title}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Tailor metrics and modules according to your current focus and priorities
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Workflow & Interest Presets */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                1. Choose Workflow Preset
              </label>
              <span className="text-[11px] text-stone-400">1-click configuration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {presetList.map((preset) => {
                const Icon = preset.icon;
                const isSelected = draftConfig.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 border-stone-900 dark:border-stone-100 shadow-xs"
                        : "bg-white dark:bg-[#0C0B0A] border-stone-200/80 dark:border-stone-800/80 text-stone-800 dark:text-stone-200 hover:border-stone-300 dark:hover:border-stone-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`p-1.5 rounded-lg ${
                          isSelected
                            ? "bg-stone-800 text-stone-100 dark:bg-stone-200 dark:text-stone-900"
                            : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold">{preset.title}</div>
                      <div
                        className={`text-[10px] mt-0.5 line-clamp-2 leading-tight ${
                          isSelected
                            ? "text-stone-300 dark:text-stone-600"
                            : "text-stone-500 dark:text-stone-400"
                        }`}
                      >
                        {preset.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Personal Focus Tagline */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-1.5">
              2. Focus Tagline & Motivation
            </label>
            <input
              type="text"
              value={draftConfig.focus_tagline}
              onChange={(e) => handleTaglineChange(e.target.value)}
              placeholder="e.g. Placement prep, full-stack systems, or semester exams..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
            />
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-stone-400">Quick suggestions:</span>
              {suggestedTaglines.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTaglineChange(tag)}
                  className="text-[10px] px-2 py-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 transition cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Metric Cards Toggles */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                3. Primary Top Metrics Row
              </label>
              <span className="text-[11px] font-mono text-stone-500">
                {activeMetricsCount} / 6 selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {[
                {
                  key: "pending_tasks" as const,
                  label: "Pending Tasks",
                  desc: "Active tasks countdown",
                  icon: CheckCircle2,
                },
                {
                  key: "habits_streak" as const,
                  label: "Habits Streak",
                  desc: "Daily habit rate %",
                  icon: Flame,
                },
                {
                  key: "dsa_solved" as const,
                  label: "DSA Solved",
                  desc: "LeetCode solved count",
                  icon: Code2,
                },
                {
                  key: "current_semester" as const,
                  label: "Semester & GPA",
                  desc: "Degree & semester snapshot",
                  icon: GraduationCap,
                },
                {
                  key: "study_hours" as const,
                  label: "Focus Study Hours",
                  desc: "Weekly deep work time",
                  icon: Timer,
                },
                {
                  key: "active_projects" as const,
                  label: "Active Projects",
                  desc: "Engineering projects in flight",
                  icon: FolderGit2,
                },
              ].map((m) => {
                const Icon = m.icon;
                const isChecked = draftConfig.metrics[m.key];
                return (
                  <label
                    key={m.key}
                    onClick={() => handleToggleMetric(m.key)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                      isChecked
                        ? "bg-white dark:bg-[#161514] border-stone-400 dark:border-stone-600 shadow-2xs"
                        : "bg-stone-100/40 dark:bg-[#0C0B0A] border-stone-200 dark:border-stone-800 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by container
                      className="mt-0.5 rounded text-stone-900 focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-stone-800 dark:text-stone-200">
                        <Icon className="w-3.5 h-3.5 text-stone-500" />
                        <span>{m.label}</span>
                      </div>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                        {m.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 4: Main Dashboard Widgets Toggles */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
                4. Dashboard Modules & Widgets
              </label>
              <span className="text-[11px] font-mono text-stone-500">
                {activeWidgetsCount} / 8 active
              </span>
            </div>
            <div className="space-y-2">
              {[
                {
                  key: "discipline_heatmap" as const,
                  title: "Consistency & Discipline Heatmap Preview",
                  desc: "GitHub-style daily activity visualization and streak motivation directly on your command center.",
                  icon: Sparkles,
                },
                {
                  key: "priority_tasks" as const,
                  title: "Priority Tasks Checklist",
                  desc: "Fast inline task creation, priority badges, and status toggle filters.",
                  icon: CheckCircle2,
                },
                {
                  key: "focus_timer" as const,
                  title: "Deep Work & Pomodoro Timer",
                  desc: "25m focus / 50m deep work sessions with live countdown and audio chimes.",
                  icon: Timer,
                },
                {
                  key: "daily_habits" as const,
                  title: "Daily Habits & Streak Flame",
                  desc: "Daily habit tracking with streak counters and instant 1-click completion.",
                  icon: Flame,
                },
                {
                  key: "scratchpad" as const,
                  title: "Quick Scratchpad",
                  desc: "Distraction-free auto-saving scratchpad for temporary notes and clipboard snippets.",
                  icon: StickyNote,
                },
                {
                  key: "academic_snapshot" as const,
                  title: "Academic Progress & Syllabus Snapshot",
                  desc: "Quick view of active semester, target GPA, and fast link to Academic OS.",
                  icon: GraduationCap,
                },
                {
                  key: "active_projects" as const,
                  title: "Engineering Projects Quick-View",
                  desc: "Highlights active repositories, tech stack tags, and live deployment links.",
                  icon: FolderGit2,
                },
                {
                  key: "dsa_snapshot" as const,
                  title: "DSA Practice Quick-Solve",
                  desc: "Key high-yield algorithmic topics (Arrays, Trees, Graphs, DP) and direct practice launcher.",
                  icon: Code2,
                },
              ].map((w) => {
                const Icon = w.icon;
                const isChecked = draftConfig.widgets[w.key];
                return (
                  <div
                    key={w.key}
                    onClick={() => handleToggleWidget(w.key)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                      isChecked
                        ? "bg-white dark:bg-[#161514] border-stone-300 dark:border-stone-700 shadow-2xs"
                        : "bg-stone-100/50 dark:bg-[#0C0B0A] border-stone-200/60 dark:border-stone-800/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition shrink-0 ${
                          isChecked
                            ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                            : "bg-stone-200 dark:bg-stone-800 text-stone-500"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                          {w.title}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400">
                          {w.desc}
                        </div>
                      </div>
                    </div>

                    <div className="pl-3">
                      <div
                        className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                          isChecked ? "bg-stone-900 dark:bg-stone-100" : "bg-stone-300 dark:bg-stone-700"
                        }`}
                      >
                        <div
                          className={`bg-white dark:bg-stone-900 w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            isChecked ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-stone-100/70 dark:bg-stone-900/40 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={isSaving}
              className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Apply & Save"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
