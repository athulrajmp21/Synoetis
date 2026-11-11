import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  GraduationCap,
  Plus,
  Flame,
  Calendar,
  Sparkles,
  Trash2,
  ArrowRight,
  Check,
  StickyNote,
  SlidersHorizontal,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Zap,
  FolderGit2,
  GitBranch,
  ExternalLink,
  BookOpen,
  Target,
  Brain,
} from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/Button";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { DifficultyDot } from "@/components/ui/DifficultyDot";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useFocusTimerStore } from "@/stores/useFocusTimerStore";
import {
  taskService,
  habitService,
  dashboardService,
  settingsService,
  academicService,
  projectService,
  dsaService,
  srsService,
} from "@/services/api";
import { Task, HabitItem, SemesterItem, ProjectItem, DsaProblemItem } from "@/types/models";
import { DashboardStats } from "@/types/system";
import { AcademicSetupModal } from "@/components/academic/AcademicSetupModal";
import { CustomizeDashboardModal } from "@/components/dashboard/CustomizeDashboardModal";
import { SrsReviewModal } from "@/components/srs/SrsReviewModal";
import { DashboardHeatmapPreview } from "@/components/dashboard/DashboardHeatmapPreview";
import {
  DashboardConfig,
  DEFAULT_DASHBOARD_CONFIG,
} from "@/types/dashboardConfig";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { setQuickCaptureOpen } = useNavigationStore();

  const [stats, setStats] = useState<DashboardStats>({
    pending_tasks_count: 0,
    active_projects_count: 0,
    dsa_solved_count: 0,
    current_semester: "Not Set",
    weekly_study_hours: 0,
    active_goals_count: 0,
    upcoming_assessments_count: 0,
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [dsaProblems, setDsaProblems] = useState<DsaProblemItem[]>([]);
  const [degree, setDegree] = useState("");
  const [targetGpa, setTargetGpa] = useState("");
  const [semesters, setSemesters] = useState<SemesterItem[]>([]);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isSrsModalOpen, setIsSrsModalOpen] = useState(false);
  const [srsDueCount, setSrsDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // User Dashboard Customization Configuration
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(DEFAULT_DASHBOARD_CONFIG);

  // New task inline state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"urgent" | "high" | "medium" | "low">("medium");
  const [newTaskCategory, setNewTaskCategory] = useState("general");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("pending");

  // New habit inline state
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [isAddingHabit, setIsAddingHabit] = useState(false);

  // Quick Scratchpad
  const [scratchpad, setScratchpad] = useState<string>(() => {
    return localStorage.getItem("lifeos_scratchpad") || "";
  });
  const [scratchpadSaved, setScratchpadSaved] = useState(false);

  // Focus Timer Store
  const {
    mode: timerMode,
    timeLeft,
    duration,
    isRunning: isTimerRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode: setTimerMode,
    completedSessionsToday,
  } = useFocusTimerStore();

  const timerMinutes = Math.floor(timeLeft / 60);
  const timerSeconds = timeLeft % 60;
  const timerFormatted = `${String(timerMinutes).padStart(2, "0")}:${String(timerSeconds).padStart(2, "0")}`;
  const timerProgress = Math.round(((duration - timeLeft) / duration) * 100);

  // Load initial data and dashboard preferences from SQLite
  const loadData = async () => {
    try {
      const [
        statsData,
        tasksData,
        habitsData,
        deg,
        gpa,
        sems,
        projData,
        dsaData,
        savedConfigStr,
        srsOverview,
      ] = await Promise.all([
        dashboardService.getDashboardStats(),
        taskService.getTasks(),
        habitService.getHabits(),
        settingsService.getSetting("academic_degree"),
        settingsService.getSetting("academic_target_gpa"),
        academicService.getSemesters(),
        projectService.getProjects(),
        dsaService.getDsaProblems(),
        settingsService.getSetting("dashboard_config"),
        srsService.getOverview().catch(() => null),
      ]);

      if (srsOverview) {
        setSrsDueCount(srsOverview.due_today_count);
      }

      setStats(statsData);
      setTasks(tasksData);
      setHabits(habitsData);
      if (deg) setDegree(deg);
      if (gpa) setTargetGpa(gpa);
      setSemesters(sems);
      setProjects(projData);
      setDsaProblems(dsaData);

      if (savedConfigStr) {
        try {
          const parsed = JSON.parse(savedConfigStr);
          setDashboardConfig((prev) => ({
            ...prev,
            ...parsed,
            metrics: { ...prev.metrics, ...(parsed.metrics || {}) },
            widgets: { ...prev.widgets, ...(parsed.widgets || {}) },
          }));
        } catch (e) {
          console.warn("Could not parse dashboard_config JSON:", e);
        }
      }
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveDashboardConfig = async (newConfig: DashboardConfig) => {
    setDashboardConfig(newConfig);
    await settingsService.setSetting("dashboard_config", JSON.stringify(newConfig));
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "done" ? "todo" : "done";
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus as any } : t))
    );
    await taskService.updateTaskStatus(id, nextStatus);
    const updatedStats = await dashboardService.getDashboardStats();
    setStats(updatedStats);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const created = await taskService.createTask({
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      category: newTaskCategory,
    });

    setTasks((prev) => [created, ...prev]);
    setNewTaskTitle("");
    setIsAddingTask(false);

    const updatedStats = await dashboardService.getDashboardStats();
    setStats(updatedStats);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await taskService.deleteTask(id);
    const updatedStats = await dashboardService.getDashboardStats();
    setStats(updatedStats);
  };

  const handleToggleHabit = async (id: string) => {
    const isNowDone = await habitService.toggleHabitToday(id);
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              is_completed_today: isNowDone,
              streak: isNowDone ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h
      )
    );
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const created = await habitService.createHabit({
      title: newHabitTitle.trim(),
      category: "productivity",
    });

    setHabits((prev) => [...prev, created]);
    setNewHabitTitle("");
    setIsAddingHabit(false);
  };

  const handleDeleteHabit = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await habitService.deleteHabit(id);
  };

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setScratchpad(val);
    localStorage.setItem("lifeos_scratchpad", val);
    setScratchpadSaved(true);
    setTimeout(() => setScratchpadSaved(false), 1500);
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "pending") return t.status !== "done";
    if (taskFilter === "completed") return t.status === "done";
    return true;
  });

  const pendingTasks = tasks.filter((t) => t.status !== "done").length;
  const completedHabitsCount = habits.filter((h) => h.is_completed_today).length;
  const habitCompletionRate =
    habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;

  const currentActiveSem = semesters.find((s) => s.status === "active");

  // Filtered metrics list based on user customization
  const enabledMetrics = [
    dashboardConfig.metrics.pending_tasks && (
      <MetricCard
        key="tasks"
        title="Pending Tasks"
        value={pendingTasks}
        subtitle={
          tasks.length > 0
            ? `${tasks.length - pendingTasks} completed today`
            : "0 active items"
        }
        icon={CheckCircle2}
        onClick={() => navigate("/tasks")}
      />
    ),
    dashboardConfig.metrics.habits_streak && (
      <MetricCard
        key="habits"
        title="Habits Streak"
        value={`${habitCompletionRate}%`}
        subtitle={`${completedHabitsCount}/${habits.length} completed today`}
        icon={Flame}
        onClick={() => navigate("/habits")}
      />
    ),
    dashboardConfig.metrics.dsa_solved && (
      <MetricCard
        key="dsa"
        title="DSA Solved"
        value={stats.dsa_solved_count}
        subtitle="Problems mastered"
        icon={Code2}
        onClick={() => navigate("/dsa")}
      />
    ),
    dashboardConfig.metrics.current_semester && (
      <MetricCard
        key="academic"
        title="Current Semester"
        value={
          currentActiveSem
            ? currentActiveSem.name
            : stats.current_semester === "Not Set"
            ? "Not Set"
            : stats.current_semester
        }
        subtitle={degree || "Click to configure profile"}
        icon={GraduationCap}
        onClick={() => setIsSetupModalOpen(true)}
      />
    ),
    dashboardConfig.metrics.study_hours && (
      <MetricCard
        key="study_hours"
        title="Weekly Deep Work"
        value={`${stats.weekly_study_hours || 0}h`}
        subtitle="Focus session time"
        icon={Timer}
      />
    ),
    dashboardConfig.metrics.active_projects && (
      <MetricCard
        key="projects"
        title="Active Projects"
        value={projects.filter((p) => p.status === "active").length || projects.length}
        subtitle="Engineering builds"
        icon={FolderGit2}
        onClick={() => navigate("/projects")}
      />
    ),
  ].filter(Boolean);

  // Determine dynamic column layout
  const hasLeftWidgets =
    dashboardConfig.widgets.priority_tasks ||
    dashboardConfig.widgets.active_projects ||
    dashboardConfig.widgets.scratchpad;

  const hasRightWidgets =
    dashboardConfig.widgets.focus_timer ||
    dashboardConfig.widgets.daily_habits ||
    dashboardConfig.widgets.discipline_heatmap ||
    dashboardConfig.widgets.academic_snapshot ||
    dashboardConfig.widgets.dsa_snapshot;

  return (
    <div className="space-y-6 pb-10">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Command Center
              <Sparkles className="w-4 h-4 text-stone-500 animate-pulse" />
            </h2>
            {dashboardConfig.preset !== "all" && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold tracking-wider">
                {dashboardConfig.preset}
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {dashboardConfig.focus_tagline || "Daily focus, pending priorities, and progress overview."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {srsDueCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSrsModalOpen(true)}
              className="text-xs border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center gap-1.5 shadow-2xs cursor-pointer animate-pulse"
              title={`${srsDueCount} flashcards due for review today`}
            >
              <Brain className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Review SRS ({srsDueCount})</span>
            </Button>
          )}

          {/* Customise Dashboard Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="text-xs border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300 flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Customise layout, metrics & interest preset"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Customise View</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setQuickCaptureOpen(true)}
            className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quick Capture</span>
          </Button>
        </div>
      </div>

      {/* SRS Due Today Alert Banner */}
      {srsDueCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/25 text-amber-900 dark:text-amber-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Spaced Repetition Review Due</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold">
                  {srsDueCount} card{srsDueCount > 1 ? "s" : ""} scheduled today
                </span>
              </div>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/80 mt-0.5">
                Keep your algorithms & system concepts sharp with active recall (<kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60">Space</kbd> to flip, <kbd className="font-mono text-[9px] px-1 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60">1-4</kbd> to rate).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => setIsSrsModalOpen(true)}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-stone-900 font-medium px-3.5 py-1.5 h-8 rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Review Now</span>
            </Button>
          </div>
        </div>
      )}

      {/* Primary Metrics Row (Conditional based on user customization) */}
      {enabledMetrics.length > 0 && (
        <div
          className={`grid gap-3 ${
            enabledMetrics.length === 1
              ? "grid-cols-1 max-w-sm"
              : enabledMetrics.length === 2
              ? "grid-cols-2"
              : enabledMetrics.length === 3
              ? "grid-cols-1 sm:grid-cols-3"
              : "grid-cols-2 md:grid-cols-4"
          }`}
        >
          {enabledMetrics}
        </div>
      )}

      {/* Main Interactive Grid (Adapts automatically based on enabled widgets) */}
      {!hasLeftWidgets && !hasRightWidgets ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-[#FAF8F5]/60 dark:bg-[#141312]/60 p-8">
          <SlidersHorizontal className="w-8 h-8 mx-auto text-stone-400 mb-3" />
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            All Dashboard Modules are Hidden
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            You've customized your view to hide all cards. Click below to re-enable modules according to your interests.
          </p>
          <Button
            size="sm"
            onClick={() => setIsCustomizeModalOpen(true)}
            className="text-xs bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
          >
            Open Customisation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          {hasLeftWidgets && (
            <div
              className={`${
                hasRightWidgets ? "lg:col-span-8" : "lg:col-span-12"
              } space-y-6`}
            >
              {/* Priority Tasks Card */}
              {dashboardConfig.widgets.priority_tasks && (
                <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Priority Tasks
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                        {pendingTasks} remaining
                      </span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-[#F3EFEA] dark:bg-[#191816] p-0.5 rounded-lg text-[11px]">
                      <button
                        onClick={() => setTaskFilter("pending")}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                          taskFilter === "pending"
                            ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                            : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                        }`}
                      >
                        Pending ({pendingTasks})
                      </button>
                      <button
                        onClick={() => setTaskFilter("all")}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                          taskFilter === "all"
                            ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                            : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                        }`}
                      >
                        All ({tasks.length})
                      </button>
                      <button
                        onClick={() => setTaskFilter("completed")}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                          taskFilter === "completed"
                            ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                            : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
                        }`}
                      >
                        Done ({tasks.length - pendingTasks})
                      </button>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="divide-y divide-stone-200/50 dark:divide-stone-800/50 mt-1">
                    {filteredTasks.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          {taskFilter === "completed"
                            ? "No completed tasks yet."
                            : "No priority tasks. Add one below to get started!"}
                        </p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => {
                        const isDone = task.status === "done";
                        return (
                          <div
                            key={task.id}
                            className="group py-2.5 px-2 flex items-center justify-between rounded-xl hover:bg-stone-200/30 dark:hover:bg-stone-900/40 transition"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                              <button
                                onClick={() => handleToggleTask(task.id, task.status)}
                                className={`w-4 h-4 rounded-md border flex items-center justify-center transition shrink-0 cursor-pointer ${
                                  isDone
                                    ? "bg-stone-900 border-stone-900 text-stone-50 dark:bg-stone-100 dark:border-stone-100 dark:text-stone-900"
                                    : "border-stone-300 dark:border-stone-700 hover:border-stone-500"
                                }`}
                              >
                                {isDone && <Check className="w-3 h-3" />}
                              </button>

                              <span
                                className={`text-xs truncate ${
                                  isDone
                                    ? "line-through text-stone-400 dark:text-stone-500"
                                    : "text-stone-800 dark:text-stone-200"
                                }`}
                              >
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <PriorityIcon priority={task.priority} />
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-1 transition cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Inline Task Add Form */}
                  {isAddingTask ? (
                    <form
                      onSubmit={handleAddTask}
                      className="mt-3 pt-3 border-t border-stone-200/60 dark:border-stone-800/60"
                    >
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          placeholder="What needs to be done?"
                          autoFocus
                          className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                        />
                        <div className="flex items-center gap-1.5">
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value as any)}
                            className="text-xs px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300"
                          >
                            <option value="urgent">Urgent</option>
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                          <Button
                            type="submit"
                            size="sm"
                            className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                          >
                            Add
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsAddingTask(false)}
                            className="text-xs text-stone-500"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsAddingTask(true)}
                      className="w-full mt-3 py-2 px-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Priority Task</span>
                    </button>
                  )}
                </div>
              )}

              {/* Engineering Projects Quick-View (if enabled) */}
              {dashboardConfig.widgets.active_projects && (
                <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2.5">
                      <FolderGit2 className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Active Engineering Projects
                      </h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
                        {projects.length} builds
                      </span>
                    </div>

                    <button
                      onClick={() => navigate("/projects")}
                      className="flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer"
                    >
                      <span>Open Projects OS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2 mt-3">
                    {projects.length === 0 ? (
                      <div className="py-6 text-center">
                        <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">
                          No engineering projects logged yet.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate("/projects")}
                          className="text-xs"
                        >
                          Create First Project
                        </Button>
                      </div>
                    ) : (
                      projects.slice(0, 3).map((proj) => (
                        <div
                          key={proj.id}
                          className="p-3 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between hover:border-stone-300 dark:hover:border-stone-700 transition"
                        >
                          <div className="flex-1 min-w-0 pr-3">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200 truncate">
                                {proj.title}
                              </h4>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium uppercase ${
                                  proj.status === "active"
                                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                    : proj.status === "completed"
                                    ? "bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                                    : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                }`}
                              >
                                {proj.status}
                              </span>
                            </div>
                            {proj.description && (
                              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                                {proj.description}
                              </p>
                            )}
                            {proj.tech_stack.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 overflow-hidden">
                                {proj.tech_stack.slice(0, 3).map((tech) => (
                                  <span
                                    key={tech}
                                    className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {proj.repo_url && (
                              <a
                                href={proj.repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                                title="Repository"
                              >
                                <GitBranch className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {proj.live_url && (
                              <a
                                href={proj.live_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                                title="Live URL"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Quick Scratchpad (if enabled) */}
              {dashboardConfig.widgets.scratchpad && (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
                      <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        Quick Scratchpad
                      </h4>
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      {scratchpadSaved ? "Saved" : "Auto-saves locally"}
                    </span>
                  </div>
                  <textarea
                    value={scratchpad}
                    onChange={handleScratchpadChange}
                    placeholder="Dump quick thoughts, clipboard snippets, or temporary notes here..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400 resize-none font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Right Column */}
          {hasRightWidgets && (
            <div
              className={`${
                hasLeftWidgets ? "lg:col-span-4" : "lg:col-span-12 max-w-2xl mx-auto"
              } space-y-6`}
            >
              {/* Deep Work Focus Widget (if enabled) */}
              {dashboardConfig.widgets.focus_timer && (
                <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <Timer
                        className={`w-4 h-4 ${
                          isTimerRunning
                            ? "text-amber-500 animate-spin"
                            : "text-stone-700 dark:text-stone-300"
                        }`}
                      />
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Focus & Deep Work
                      </h3>
                    </div>
                    {isTimerRunning ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold animate-pulse">
                        ● ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-mono font-semibold tracking-wider text-stone-400">
                        {timerMode}
                      </span>
                    )}
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F3EFEA] dark:bg-[#191816] mt-3 mb-3 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setTimerMode("pomodoro")}
                      className={`py-1 rounded-lg font-medium transition cursor-pointer text-center ${
                        timerMode === "pomodoro"
                          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                      }`}
                    >
                      25m Focus
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerMode("deepwork")}
                      className={`py-1 rounded-lg font-medium transition cursor-pointer text-center ${
                        timerMode === "deepwork"
                          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                      }`}
                    >
                      50m Deep
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimerMode("shortbreak")}
                      className={`py-1 rounded-lg font-medium transition cursor-pointer text-center ${
                        timerMode === "shortbreak"
                          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                          : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
                      }`}
                    >
                      5m Break
                    </button>
                  </div>

                  {/* Countdown Box */}
                  <div className="py-4 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/70 dark:border-stone-800/70 text-center">
                    <div className="text-3xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100">
                      {timerFormatted}
                    </div>
                    <div className="w-4/5 mx-auto h-1.5 bg-stone-200/60 dark:border-stone-800 bg-stone-200 dark:bg-stone-800 rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full bg-stone-900 dark:bg-stone-100 rounded-full transition-all duration-500"
                        style={{ width: `${timerProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                    <span className="text-[11px] text-stone-400 font-mono">
                      {completedSessionsToday} sessions today
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={resetTimer}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                        title="Reset"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      {isTimerRunning ? (
                        <button
                          type="button"
                          onClick={pauseTimer}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold cursor-pointer shadow-xs hover:opacity-90 transition"
                        >
                          <Pause className="w-3 h-3" />
                          <span>Pause</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={startTimer}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs font-semibold cursor-pointer shadow-xs hover:opacity-90 transition"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DSA Quick Practice Snapshot (if enabled) */}
              {dashboardConfig.widgets.dsa_snapshot && (
                <div className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        DSA Problem Solving
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-stone-600 dark:text-stone-400">
                      {dsaProblems.filter((p) => p.independent_solve).length} / {dsaProblems.length} Solved
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    <p className="text-[11px] text-stone-500 dark:text-stone-400">
                      Target high-yield algorithmic patterns for technical interviews.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Arrays & Hashing", "Two Pointers", "Trees & Graphs", "Dynamic Prog."].map((topic) => (
                        <div
                          key={topic}
                          className="p-2 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/60 dark:border-stone-800/60 text-xs"
                        >
                          <span className="text-[11px] font-medium text-stone-800 dark:text-stone-200 block truncate">
                            {topic}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between">
                    <button
                      onClick={() => navigate("/dsa")}
                      className="flex items-center gap-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer"
                    >
                      <span>Open DSA Tracker</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Daily Habits Matrix Card (if enabled) */}
              {dashboardConfig.widgets.daily_habits && (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                        Daily Habits
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400">
                      {completedHabitsCount}/{habits.length} Done
                    </span>
                  </div>

                  <div className="space-y-1.5 mt-2.5 max-h-44 overflow-y-auto pr-0.5">
                    {habits.length === 0 ? (
                      <div className="py-4 text-center">
                        <p className="text-xs text-stone-400 dark:text-stone-500">
                          No active habits yet. Add one to track streaks!
                        </p>
                      </div>
                    ) : (
                      habits.map((habit) => (
                        <div
                          key={habit.id}
                          className="group flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/60 dark:border-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700 transition"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                            <button
                              onClick={() => handleToggleHabit(habit.id)}
                              className={`w-4.5 h-4.5 rounded-lg flex items-center justify-center transition shrink-0 cursor-pointer ${
                                habit.is_completed_today
                                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                                  : "border border-stone-300 dark:border-stone-700 hover:border-stone-500"
                              }`}
                              title={
                                habit.is_completed_today
                                  ? "Completed today"
                                  : "Mark done today"
                              }
                            >
                              {habit.is_completed_today && (
                                <Check className="w-3 h-3" />
                              )}
                            </button>
                            <span
                              className={`text-xs truncate ${
                                habit.is_completed_today
                                  ? "line-through text-stone-400 dark:text-stone-500"
                                  : "text-stone-800 dark:text-stone-200 font-medium"
                              }`}
                            >
                              {habit.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="flex items-center gap-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">
                              <Flame className="w-3 h-3 fill-amber-500/20" />
                              <span>{habit.streak}d</span>
                            </div>
                            <button
                              onClick={() => handleDeleteHabit(habit.id)}
                              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-0.5 transition cursor-pointer"
                              title="Delete habit"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Inline Habit Add Form */}
                  {isAddingHabit ? (
                    <form
                      onSubmit={handleAddHabit}
                      className="mt-2.5 pt-2.5 border-t border-stone-200/60 dark:border-stone-800/60"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newHabitTitle}
                          onChange={(e) => setNewHabitTitle(e.target.value)}
                          placeholder="New habit name..."
                          autoFocus
                          className="flex-1 text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAddingHabit(false)}
                          className="text-xs text-stone-500"
                        >
                          ✕
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setIsAddingHabit(true)}
                      className="w-full mt-2.5 py-1.5 px-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Habit</span>
                    </button>
                  )}
                </div>
              )}

              {/* Discipline & Consistency Heatmap Preview (Right side under Daily Habits) */}
              {dashboardConfig.widgets.discipline_heatmap && (
                <DashboardHeatmapPreview />
              )}

              {/* Academic OS Snapshot Card (if enabled) */}
              {dashboardConfig.widgets.academic_snapshot && (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                      <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        Academic Progress
                      </h4>
                    </div>
                    <button
                      onClick={() => setIsSetupModalOpen(true)}
                      className="text-[11px] text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 underline underline-offset-2 transition cursor-pointer"
                    >
                      {currentActiveSem ? "Change" : "Configure"}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    {currentActiveSem
                      ? `Enrolled in ${currentActiveSem.name}${degree ? ` (${degree})` : ""}. Track syllabus and exams.`
                      : "Configure your degree and active semester to get tailored deadline alerts and credit roadmaps."}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
                    <button
                      onClick={() => navigate("/academic")}
                      className="flex items-center gap-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer"
                    >
                      <span>Open Academic OS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customise Dashboard Modal */}
      <CustomizeDashboardModal
        isOpen={isCustomizeModalOpen}
        onClose={() => setIsCustomizeModalOpen(false)}
        config={dashboardConfig}
        onSave={handleSaveDashboardConfig}
      />

      {/* Academic Setup Modal */}
      <AcademicSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSaved={loadData}
        initialSemester={currentActiveSem ? currentActiveSem.number : 1}
        initialDegree={degree}
        initialGpa={targetGpa}
      />

      {/* Spaced Repetition (SRS) Review Modal */}
      <SrsReviewModal
        isOpen={isSrsModalOpen}
        onClose={() => setIsSrsModalOpen(false)}
        onCompletedReview={() => {
          setIsSrsModalOpen(false);
          loadData();
        }}
      />
    </div>
  );
};
