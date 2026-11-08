import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  GraduationCap,
  FolderGit2,
  Target,
  Plus,
  Flame,
  Calendar,
  Sparkles,
  Trash2,
  ArrowRight,
  Check,
  StickyNote,
} from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNavigationStore } from "@/stores/useNavigationStore";

interface PriorityTask {
  id: string;
  title: string;
  tag: string;
  due: string;
  priority: "Urgent" | "High" | "Medium" | "Low";
  completed: boolean;
}

interface DailyHabit {
  id: string;
  title: string;
  streak: number;
  completedToday: boolean;
}

const INITIAL_TASKS: PriorityTask[] = [
  {
    id: "t1",
    title: "Solve 3 LeetCode Mediums on Dynamic Programming",
    tag: "DSA Practice",
    due: "5:00 PM",
    priority: "High",
    completed: false,
  },
  {
    id: "t2",
    title: "Review Operating Systems Chapter 4 (Process Synchronization)",
    tag: "Academic OS",
    due: "Today",
    priority: "Medium",
    completed: false,
  },
  {
    id: "t3",
    title: "Implement Notion-Style Block Editor in Knowledge Hub",
    tag: "Projects",
    due: "Today",
    priority: "Urgent",
    completed: true,
  },
  {
    id: "t4",
    title: "Submit Software Engineering Lab #3 Report",
    tag: "Academic OS",
    due: "Nov 09",
    priority: "High",
    completed: false,
  },
];

const INITIAL_HABITS: DailyHabit[] = [
  { id: "h1", title: "Solve 2 DSA Problems", streak: 14, completedToday: true },
  { id: "h2", title: "Read System Design Architecture Paper", streak: 7, completedToday: false },
  { id: "h3", title: "Deep Work Focus Block (2 hrs)", streak: 18, completedToday: true },
  { id: "h4", title: "Daily Code Commit to Life OS", streak: 42, completedToday: true },
];

export const DashboardPage: React.FC = () => {
  const { setQuickCaptureOpen } = useNavigationStore();

  // Interactive Task Management State
  const [tasks, setTasks] = useState<PriorityTask[]>(() => {
    const saved = localStorage.getItem("lifeos_dashboard_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Urgent" | "High" | "Medium" | "Low">("Medium");
  const [newTaskTag, setNewTaskTag] = useState("General");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");

  // Interactive Habit Tracking State
  const [habits, setHabits] = useState<DailyHabit[]>(() => {
    const saved = localStorage.getItem("lifeos_dashboard_habits");
    return saved ? JSON.parse(saved) : INITIAL_HABITS;
  });

  // Interactive Scratchpad State
  const [scratchpad, setScratchpad] = useState<string>(() => {
    return (
      localStorage.getItem("lifeos_dashboard_scratchpad") ||
      "💡 Quick thoughts & immediate tasks for today:\n• Review Rust async lifetimes\n• Run benchmarks for desktop SQLite queries"
    );
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem("lifeos_dashboard_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("lifeos_dashboard_habits", JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    localStorage.setItem("lifeos_dashboard_scratchpad", scratchpad);
  }, [scratchpad]);

  // Toggle task completion
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Add new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: PriorityTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      tag: newTaskTag,
      due: "Today",
      priority: newTaskPriority,
      completed: false,
    };

    setTasks([newTask, ...tasks]);
    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Toggle daily habit & update streak
  const handleToggleHabit = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const willComplete = !h.completedToday;
          return {
            ...h,
            completedToday: willComplete,
            streak: willComplete ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      })
    );
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Current formatted date
  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const completedHabitsCount = habits.filter((h) => h.completedToday).length;

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "pending") return !t.completed;
    if (taskFilter === "completed") return t.completed;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* User Welcome & Productivity Header (Clean, Zero SQLite Jargon) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {getGreeting()}, Engineer
            </h1>
            <span className="text-lg">⚡</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {todayDate} • {pendingTasksCount} priorities remaining today
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingTask(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setQuickCaptureOpen(true)}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Quick Capture
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Priorities"
          value={`${pendingTasksCount} Pending`}
          subtitle={`${tasks.length - pendingTasksCount} completed today`}
          icon={CheckCircle2}
        />
        <MetricCard
          title="DSA Solved"
          value="184 Problems"
          subtitle="Target: 3 problems/day"
          trend="+12 this week"
          icon={Code2}
        />
        <MetricCard
          title="Study Time"
          value="22.5 hrs"
          subtitle="Weekly target: 25 hrs"
          icon={Clock}
        />
        <MetricCard
          title="Habit Discipline"
          value={`${completedHabitsCount} / ${habits.length}`}
          subtitle="All active streaks intact"
          icon={Flame}
        />
      </div>

      {/* Main 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Today's Priorities & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Today's Priorities Card */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Today's Priorities
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  ({pendingTasksCount} open)
                </span>
              </div>

              {/* Filter Tabs & Add Button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 text-[11px]">
                  <button
                    onClick={() => setTaskFilter("all")}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      taskFilter === "all"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTaskFilter("pending")}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      taskFilter === "pending"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setTaskFilter("completed")}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      taskFilter === "completed"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    Done
                  </button>
                </div>

                <button
                  onClick={() => setIsAddingTask(!isAddingTask)}
                  className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                  title="Add new task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Add Inline Form */}
            {isAddingTask && (
              <form
                onSubmit={handleAddTask}
                className="mb-3 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-2.5 animate-in fade-in duration-150"
              >
                <input
                  type="text"
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title (e.g. Implement Raft heartbeat loop)..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <select
                      value={newTaskPriority}
                      onChange={(e) =>
                        setNewTaskPriority(
                          e.target.value as "Urgent" | "High" | "Medium" | "Low"
                        )
                      }
                      className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
                    >
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>

                    <select
                      value={newTaskTag}
                      onChange={(e) => setNewTaskTag(e.target.value)}
                      className="px-2 py-1 text-[11px] rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none"
                    >
                      <option value="DSA Practice">DSA Practice</option>
                      <option value="Academic OS">Academic OS</option>
                      <option value="Projects">Projects</option>
                      <option value="Career">Career</option>
                      <option value="General">General</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs shadow-xs"
                    >
                      Save Task
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Task Item List with Instant Click Toggle */}
            <div className="space-y-1.5">
              {filteredTasks.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No tasks in this view. All caught up!
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                      task.completed
                        ? "border-slate-100 dark:border-slate-800/40 bg-slate-50/40 dark:bg-slate-900/20 opacity-70"
                        : "border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          task.completed
                            ? "bg-emerald-500 text-white border border-emerald-500"
                            : "border border-slate-300 dark:border-slate-600 hover:border-indigo-500"
                        }`}
                      >
                        {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <p
                          onClick={() => handleToggleTask(task.id)}
                          className={`text-xs cursor-pointer select-none truncate ${
                            task.completed
                              ? "line-through text-slate-400 dark:text-slate-500"
                              : "font-medium text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {task.tag}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[10px] text-slate-400">
                            Due {task.due}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          task.priority === "Urgent"
                            ? "danger"
                            : task.priority === "High"
                            ? "warning"
                            : "default"
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        title="Delete task"
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Active Projects */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Active Projects
                </h2>
              </div>
              <span className="text-xs text-slate-400">2 In Progress</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: "p1",
                  title: "Life OS Desktop",
                  description: "Personal desktop OS with Tauri 2 + Rust + React 19.",
                  tech: ["Tauri 2", "Rust", "React", "SQLite"],
                  status: "Active",
                },
                {
                  id: "p2",
                  title: "Distributed KV Store",
                  description: "Raft consensus implementation in Rust with gRPC.",
                  tech: ["Rust", "Tokio", "Tonic", "Raft"],
                  status: "Planning",
                },
              ].map((proj) => (
                <div
                  key={proj.id}
                  className="p-3.5 rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/60 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {proj.title}
                      </span>
                      <Badge variant="accent" size="sm">
                        {proj.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                      {proj.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {proj.tech.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Col: Interactive Habits, Deadlines & Scratchpad */}
        <div className="space-y-6">
          {/* Interactive Daily Habits */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Daily Disciplines
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {completedHabitsCount}/{habits.length} Done
              </span>
            </div>

            <div className="space-y-2">
              {habits.map((h) => (
                <div
                  key={h.id}
                  onClick={() => handleToggleHabit(h.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    h.completedToday
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                        h.completedToday
                          ? "bg-emerald-500 text-white"
                          : "border border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {h.completedToday && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`text-xs select-none ${
                        h.completedToday
                          ? "text-slate-600 dark:text-slate-400 font-medium"
                          : "text-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {h.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400">
                    🔥 {h.streak}d
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Scratchpad */}
          <Card>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Quick Scratchpad
                </h2>
              </div>
              <span className="text-[10px] text-slate-400">Auto-saved</span>
            </div>
            <textarea
              rows={4}
              value={scratchpad}
              onChange={(e) => setScratchpad(e.target.value)}
              placeholder="Jot down quick thoughts, ideas, or links..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </Card>

          {/* Upcoming Academic Deadlines */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Upcoming Deadlines
                </h2>
              </div>
              <span className="text-xs text-slate-400">Semester 4</span>
            </div>

            <div className="space-y-2">
              {[
                {
                  course: "CS 301",
                  title: "Design & Analysis of Algorithms Midterm",
                  date: "Nov 14",
                  daysLeft: "6 days",
                },
                {
                  course: "CS 304",
                  title: "Database Systems Project Milestone #1",
                  date: "Nov 18",
                  daysLeft: "10 days",
                },
                {
                  course: "CS 308",
                  title: "Computer Networks Lab Assignment",
                  date: "Nov 22",
                  daysLeft: "14 days",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.course}
                    </span>
                    <span className="text-slate-400 font-mono">{item.daysLeft}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                    {item.title}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
