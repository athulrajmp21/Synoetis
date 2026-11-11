import React, { useState, useEffect, useMemo } from "react";
import {
  Target,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Trash2,
  Calendar,
  Flame,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  X,
  Flag,
  CheckSquare2,
  ListTodo,
  Layers,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { goalService } from "@/services/api";
import {
  GoalItem,
  MilestoneItem,
  CreateGoalInput,
  GoalCategory,
  GoalTimeframe,
  GoalStatus,
} from "@/types/models";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; badgeClass: string; dotColor: string }
> = {
  technical: {
    label: "Technical & Systems",
    badgeClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    dotColor: "bg-emerald-500",
  },
  career: {
    label: "Career & Placements",
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    dotColor: "bg-amber-500",
  },
  academic: {
    label: "Academic & University",
    badgeClass: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
    dotColor: "bg-purple-500",
  },
  personal: {
    label: "Personal & Discipline",
    badgeClass: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
    dotColor: "bg-blue-500",
  },
  fitness: {
    label: "Health & Fitness",
    badgeClass: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
    dotColor: "bg-rose-500",
  },
};

const TIMEFRAME_LABELS: Record<string, string> = {
  quarterly: "Quarterly Sprint",
  short_term: "Short-Term (< 6 Mo)",
  long_term: "Long-Term Vision",
  yearly: "Yearly Horizon",
};

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_progress" | "completed">("in_progress");

  // Expanded goal card IDs for milestone checklists
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  // Inline new milestone input per goal { [goalId]: string }
  const [inlineMilestoneInput, setInlineMilestoneInput] = useState<Record<string, string>>({});

  // Create Goal Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateGoalInput>({
    title: "",
    description: "",
    category: "technical",
    timeframe: "quarterly",
    target_date: "",
    initial_milestones: [""],
  });

  const loadData = async () => {
    try {
      const [goalsData, milestonesData] = await Promise.all([
        goalService.getGoals(),
        goalService.getMilestones(),
      ]);
      setGoals(goalsData);
      setMilestones(milestonesData);
      // Auto-expand all goals with milestones initially
      setExpandedGoals(new Set(goalsData.map((g) => g.id)));
    } catch (e) {
      console.error("Failed to load goals:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered goals
  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (statusFilter !== "all" && g.status !== statusFilter) return false;
      if (selectedCategory !== "all" && g.category !== selectedCategory) return false;
      if (selectedTimeframe !== "all" && g.timeframe !== selectedTimeframe) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesGoal =
          g.title.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q));
        const goalMs = milestones.filter((m) => m.goal_id === g.id);
        const matchesMilestone = goalMs.some((m) => m.title.toLowerCase().includes(q));
        if (!matchesGoal && !matchesMilestone) return false;
      }
      return true;
    });
  }, [goals, milestones, statusFilter, selectedCategory, selectedTimeframe, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalGoals = goals.length;
    const inProgress = goals.filter((g) => g.status === "in_progress").length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const totalMilestones = milestones.length;
    const completedMilestones = milestones.filter((m) => m.is_completed).length;
    const overallProgress =
      totalMilestones > 0
        ? Math.round((completedMilestones / totalMilestones) * 100)
        : goals.length > 0
        ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / goals.length)
        : 0;

    return {
      totalGoals,
      inProgress,
      completed,
      totalMilestones,
      completedMilestones,
      overallProgress,
    };
  }, [goals, milestones]);

  const toggleExpand = (goalId: string) => {
    setExpandedGoals((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim()) return;

    try {
      const cleanedMilestones = (createForm.initial_milestones || []).filter(
        (m) => m.trim().length > 0
      );
      const created = await goalService.createGoal({
        ...createForm,
        initial_milestones: cleanedMilestones,
      });

      setGoals((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({
        title: "",
        description: "",
        category: "technical",
        timeframe: "quarterly",
        target_date: "",
        initial_milestones: [""],
      });

      // Reload milestones to get generated IDs
      const freshMilestones = await goalService.getMilestones();
      setMilestones(freshMilestones);
      setExpandedGoals((prev) => new Set([...prev, created.id]));
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  const handleToggleMilestone = async (milestoneId: string, goalId?: string | null) => {
    try {
      const newStatus = await goalService.toggleMilestone(milestoneId);
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, is_completed: newStatus } : m))
      );

      // Refresh goals to get updated parent progress %
      const updatedGoals = await goalService.getGoals();
      setGoals(updatedGoals);
    } catch (e) {
      console.error("Failed to toggle milestone:", e);
    }
  };

  const handleAddInlineMilestone = async (goalId: string) => {
    const title = (inlineMilestoneInput[goalId] || "").trim();
    if (!title) return;

    try {
      const created = await goalService.createMilestone({
        goal_id: goalId,
        title,
      });

      setMilestones((prev) => [...prev, created]);
      setInlineMilestoneInput((prev) => ({ ...prev, [goalId]: "" }));

      // Refresh goals to get updated milestone counts and progress
      const updatedGoals = await goalService.getGoals();
      setGoals(updatedGoals);
    } catch (e) {
      console.error("Failed to add milestone:", e);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      await goalService.deleteMilestone(milestoneId);
      setMilestones((prev) => prev.filter((m) => m.id !== milestoneId));
      const updatedGoals = await goalService.getGoals();
      setGoals(updatedGoals);
    } catch (e) {
      console.error("Failed to delete milestone:", e);
    }
  };

  const handleToggleGoalStatus = async (goal: GoalItem) => {
    const nextStatus = goal.status === "completed" ? "in_progress" : "completed";
    try {
      await goalService.updateGoalStatus(goal.id, nextStatus);
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goal.id
            ? { ...g, status: nextStatus, progress: nextStatus === "completed" ? 100 : g.progress }
            : g
        )
      );
    } catch (e) {
      console.error("Failed to update goal status:", e);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalService.deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
      setMilestones((prev) => prev.filter((m) => m.goal_id !== goalId));
    } catch (e) {
      console.error("Failed to delete goal:", e);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Goals & Milestones
              <Target className="w-5 h-5 text-amber-500" />
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              OKRs & Sprints
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Transform high-level ambitions into quarterly sprints, measurable milestones, and daily execution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            variant="primary"
            className="flex items-center gap-1.5 text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Goals</span>
            <Target className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono">
              {metrics.inProgress}
            </span>
            <span className="text-xs text-stone-400">of {metrics.totalGoals} total</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Achieved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.completed}
            </span>
            <span className="text-xs text-stone-400">completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Milestones Done</span>
            <ListTodo className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono">
              {metrics.completedMilestones}
            </span>
            <span className="text-xs text-stone-400">of {metrics.totalMilestones} checks</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Overall Velocity</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono">
              {metrics.overallProgress}%
            </span>
            <span className="text-xs text-stone-400">weighted avg</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search goals, quarterly targets, or milestones..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tab Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/70">
            <button
              onClick={() => setStatusFilter("in_progress")}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                statusFilter === "in_progress"
                  ? "bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              Active ({metrics.inProgress})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              Completed ({metrics.completed})
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              All
            </button>
          </div>

          {/* Timeframe Filter */}
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Timeframes</option>
            <option value="quarterly">Quarterly Sprint</option>
            <option value="short_term">Short-Term (&lt; 6 Mo)</option>
            <option value="long_term">Long-Term Vision</option>
            <option value="yearly">Yearly Horizon</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="technical">Technical & Systems</option>
            <option value="career">Career & Placements</option>
            <option value="academic">Academic & University</option>
            <option value="personal">Personal & Discipline</option>
            <option value="fitness">Health & Fitness</option>
          </select>
        </div>
      </div>

      {/* Main Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/20">
          <Target className="w-10 h-10 text-stone-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            No goals found
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No goals matched your search query "${searchQuery}".`
              : "Set your quarterly objectives or long-term career aspirations to start tracking progress."}
          </p>
          <div className="mt-4">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="outline"
              className="text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Create First Goal
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGoals.map((goal) => {
            const goalMilestones = milestones.filter((m) => m.goal_id === goal.id);
            const isExpanded = expandedGoals.has(goal.id);
            const categoryMeta =
              CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG["personal"];
            const isCompleted = goal.status === "completed";

            return (
              <div
                key={goal.id}
                className={`rounded-2xl p-4 transition-all duration-150 flex flex-col justify-between border ${
                  isCompleted
                    ? "bg-stone-50/60 dark:bg-stone-900/30 border-stone-200/60 dark:border-stone-800/60 opacity-90"
                    : "bg-white dark:bg-[#141312] border-stone-200/80 dark:border-stone-800/80 shadow-2xs hover:shadow-xs hover:border-stone-300 dark:hover:border-stone-700"
                }`}
              >
                <div>
                  {/* Card Header: Category Badge, Timeframe, Status Action */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${categoryMeta.badgeClass}`}
                      >
                        {categoryMeta.label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                        {TIMEFRAME_LABELS[goal.timeframe] || goal.timeframe}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleGoalStatus(goal)}
                        className={`p-1 rounded-lg text-xs transition cursor-pointer ${
                          isCompleted
                            ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                        title={isCompleted ? "Reopen Goal" : "Mark as Achieved"}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 ${isCompleted ? "fill-emerald-500/20 text-emerald-600 dark:text-emerald-400" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Goal Title & Description */}
                  <h3
                    className={`text-sm font-bold tracking-tight mb-1 ${
                      isCompleted
                        ? "line-through text-stone-500 dark:text-stone-400"
                        : "text-stone-900 dark:text-stone-100"
                    }`}
                  >
                    {goal.title}
                  </h3>
                  {goal.description && (
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">
                      {goal.description}
                    </p>
                  )}

                  {/* Target Date Chip */}
                  {goal.target_date && (
                    <div className="flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-stone-500 mb-3 font-mono">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      <span>Target: {goal.target_date}</span>
                    </div>
                  )}

                  {/* Progress Bar & Percentage */}
                  <div className="mb-3.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                        Progress
                      </span>
                      <span className="font-mono font-bold text-xs text-stone-700 dark:text-stone-300">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCompleted
                            ? "bg-emerald-500"
                            : goal.progress >= 70
                            ? "bg-amber-500"
                            : "bg-stone-700 dark:bg-stone-300"
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Accordion Header */}
                  <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
                    <button
                      type="button"
                      onClick={() => toggleExpand(goal.id)}
                      className="w-full flex items-center justify-between py-1 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                        )}
                        <span>Milestones Checklist</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500">
                          {goal.completed_milestones_count}/{goal.milestones_count}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-normal">
                        {isExpanded ? "Collapse" : "Expand"}
                      </span>
                    </button>

                    {/* Milestones List */}
                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 pl-1">
                        {goalMilestones.map((ms) => (
                          <div
                            key={ms.id}
                            className="group flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900/50 transition"
                          >
                            <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ms.is_completed}
                                onChange={() => handleToggleMilestone(ms.id, goal.id)}
                                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                              />
                              <span
                                className={`text-xs truncate ${
                                  ms.is_completed
                                    ? "line-through text-stone-400 dark:text-stone-500"
                                    : "text-stone-700 dark:text-stone-300 font-medium"
                                }`}
                              >
                                {ms.title}
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={() => handleDeleteMilestone(ms.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-500 transition cursor-pointer"
                              title="Delete milestone"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}

                        {/* Inline Add Milestone Input */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={inlineMilestoneInput[goal.id] || ""}
                            onChange={(e) =>
                              setInlineMilestoneInput((prev) => ({
                                ...prev,
                                [goal.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddInlineMilestone(goal.id);
                              }
                            }}
                            placeholder="Add actionable sub-milestone (press Enter)..."
                            className="flex-1 px-2.5 py-1 text-[11px] rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddInlineMilestone(goal.id)}
                            className="px-2 py-1 text-[11px] rounded-lg bg-stone-200/70 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium transition cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141312] border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-500" />
                Define New Goal or OKR
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Distributed Systems & Build Raft Consensus Engine"
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Description & Motivation
                </label>
                <textarea
                  rows={2}
                  placeholder="Why does this goal matter? What does success look like?"
                  value={createForm.description || ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={createForm.category}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="technical">Technical & Systems</option>
                    <option value="career">Career & Placements</option>
                    <option value="academic">Academic & University</option>
                    <option value="personal">Personal & Discipline</option>
                    <option value="fitness">Health & Fitness</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Timeframe
                  </label>
                  <select
                    value={createForm.timeframe}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, timeframe: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="quarterly">Quarterly Sprint</option>
                    <option value="short_term">Short-Term (&lt; 6 Mo)</option>
                    <option value="long_term">Long-Term Vision</option>
                    <option value="yearly">Yearly Horizon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={createForm.target_date || ""}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, target_date: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                />
              </div>

              {/* Initial Milestones Checklist Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Initial Milestones Checklist
                </label>
                <div className="space-y-2">
                  {(createForm.initial_milestones || []).map((ms, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-stone-400 w-4">
                        {idx + 1}.
                      </span>
                      <input
                        type="text"
                        placeholder={`Milestone ${idx + 1} (e.g. Read Raft paper and design RPC protocols)`}
                        value={ms}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCreateForm((prev) => {
                            const updated = [...(prev.initial_milestones || [])];
                            updated[idx] = val;
                            return { ...prev, initial_milestones: updated };
                          });
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                      {(createForm.initial_milestones || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setCreateForm((prev) => ({
                              ...prev,
                              initial_milestones: (prev.initial_milestones || []).filter(
                                (_, i) => i !== idx
                              ),
                            }));
                          }}
                          className="p-1 text-stone-400 hover:text-rose-500 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setCreateForm((prev) => ({
                        ...prev,
                        initial_milestones: [...(prev.initial_milestones || []), ""],
                      }));
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add another milestone step</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="text-xs shadow-xs cursor-pointer"
                >
                  Create Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
