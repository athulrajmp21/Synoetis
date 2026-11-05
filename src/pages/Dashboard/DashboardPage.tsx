import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Code2,
  GraduationCap,
  FolderGit2,
  Target,
  ArrowUpRight,
  Plus,
  Flame,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { dashboardService, systemService } from "@/services/api";
import { DashboardStats, SystemInfo } from "@/types/system";
import { useNavigationStore } from "@/stores/useNavigationStore";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setQuickCaptureOpen } = useNavigationStore();

  useEffect(() => {
    Promise.all([
      dashboardService.getDashboardStats().then(setStats),
      systemService.getSystemInfo().then(setSystemInfo),
    ])
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Welcome back, Engineer
            </h1>
            <Badge variant="accent" size="sm">
              Phase 1 Active
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Life OS desktop environment is initialized. Local-first SQLite database connected.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setQuickCaptureOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Quick Capture
          </Button>
        </div>
      </div>

      {/* Persistence Architecture Status Alert */}
      <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-950/70 bg-indigo-50/60 dark:bg-indigo-950/20 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                SQLite Engine Initialized (Persisted)
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-200/60 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 font-mono">
                WAL Mode • Foreign Keys Enabled
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono break-all">
              Path: {systemInfo?.db_path || "Resolving app data directory..."}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Schema Migration 001 executed: 20 relational tables active.
            </p>
          </div>
        </div>

        <Badge variant="success" size="sm" className="shrink-0">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Online
        </Badge>
      </div>

      {/* Top Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Semester"
          value={stats?.current_semester || "Semester 4"}
          subtitle="Spring 2026 • 24 Credits"
          icon={GraduationCap}
        />
        <MetricCard
          title="DSA Solved"
          value={stats?.dsa_solved_count || 0}
          subtitle="Target: 3 problems/day"
          trend="+14% this week"
          icon={Code2}
        />
        <MetricCard
          title="Study Time"
          value={`${stats?.weekly_study_hours || 0} hrs`}
          subtitle="Goal: 25 hrs / week"
          icon={Clock}
        />
        <MetricCard
          title="Active Goals"
          value={stats?.active_goals_count || 0}
          subtitle="Short & long term goals"
          icon={Target}
        />
      </div>

      {/* Main 2-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Today's Priorities & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Priorities */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Today's Priorities
                </h2>
                <Badge variant="default" size="sm">
                  Placeholder Tasks
                </Badge>
              </div>
              <span className="text-xs text-slate-400">4 items</span>
            </div>

            <div className="space-y-2">
              {[
                {
                  id: "1",
                  title: "Solve 3 LeetCode Mediums on Dynamic Programming",
                  tag: "DSA Practice",
                  due: "5:00 PM",
                  priority: "High",
                },
                {
                  id: "2",
                  title: "Review Operating Systems Chapter 4 (Process Synchronization)",
                  tag: "Academic OS",
                  due: "Today",
                  priority: "Medium",
                },
                {
                  id: "3",
                  title: "Design Life OS Phase 2 Task Management Architecture",
                  tag: "Projects",
                  due: "Tomorrow",
                  priority: "High",
                },
                {
                  id: "4",
                  title: "Submit Software Engineering Lab #3 Report",
                  tag: "Academic OS",
                  due: "Nov 08",
                  priority: "Urgent",
                },
              ].map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{task.tag}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[10px] text-slate-400">Due {task.due}</span>
                      </div>
                    </div>
                  </div>
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
                </div>
              ))}
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
              <span className="text-xs text-indigo-500 hover:underline cursor-pointer flex items-center gap-1">
                View all <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                {
                  id: "p1",
                  title: "Life OS Desktop",
                  description: "Personal desktop OS with Tauri 2 + Rust + React 19.",
                  tech: ["Tauri 2", "Rust", "React", "SQLite"],
                  status: "In Progress",
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

        {/* Right Col: Academic Deadlines & Habit Streaks */}
        <div className="space-y-6">
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

            <div className="space-y-2.5">
              {[
                {
                  course: "CS 301",
                  title: "Design & Analysis of Algorithms Midterm",
                  date: "Nov 14",
                  daysLeft: "8 days",
                },
                {
                  course: "CS 304",
                  title: "Database Management Systems Project Milestone #1",
                  date: "Nov 18",
                  daysLeft: "12 days",
                },
                {
                  course: "CS 308",
                  title: "Computer Networks Lab Assignment",
                  date: "Nov 22",
                  daysLeft: "16 days",
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

          {/* Habit Streaks */}
          <Card>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Daily Disciplines
                </h2>
              </div>
              <span className="text-xs text-slate-400">Today</span>
            </div>

            <div className="space-y-2">
              {[
                { habit: "Solve 2 DSA Problems", streak: "14 days", done: true },
                { habit: "Read System Design Blog / Paper", streak: "7 days", done: false },
                { habit: "Deep Work Block (2 hrs)", streak: "18 days", done: true },
                { habit: "Daily Code Commit", streak: "42 days", done: true },
              ].map((h, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                        h.done
                          ? "bg-emerald-500 text-white"
                          : "border border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {h.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span
                      className={`text-xs ${
                        h.done
                          ? "text-slate-500 dark:text-slate-400 line-through"
                          : "text-slate-800 dark:text-slate-200 font-medium"
                      }`}
                    >
                      {h.habit}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    🔥 {h.streak}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
