import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Calendar,
  Flame,
  Clock,
  CheckCircle2,
  Code2,
  TrendingUp,
  Sparkles,
  Zap,
  Award,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { analyticsService } from "@/services/api";
import { AnalyticsOverview, HeatmapDay, DsaTopicMastery, DailyVelocity } from "@/types/models";

const LEVEL_COLORS: Record<number, string> = {
  0: "bg-stone-100 dark:bg-stone-800/60 border border-stone-200/40 dark:border-stone-800/40",
  1: "bg-amber-500/25 border border-amber-500/30",
  2: "bg-amber-500/50 border border-amber-500/50",
  3: "bg-amber-500/75 border border-amber-500/70",
  4: "bg-amber-500 border border-amber-400 shadow-xs",
};

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<number>(90); // 90, 180, 365
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const loadData = async (days: number) => {
    try {
      const overview = await analyticsService.getAnalyticsOverview(days);
      setData(overview);
    } catch (e) {
      console.error("Failed to load analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(timeRange);
  }, [timeRange]);

  // Group heatmap days into 7-day columns (weeks)
  const heatmapWeeks = useMemo(() => {
    if (!data || !data.heatmap_days) return [];
    const days = data.heatmap_days;
    const weeks: HeatmapDay[][] = [];
    let currentWeek: HeatmapDay[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === days.length - 1) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    return weeks;
  }, [data]);

  const maxWeeklyHours = useMemo(() => {
    if (!data?.weekly_velocity) return 5;
    const max = Math.max(...data.weekly_velocity.map((d) => d.study_hours));
    return max > 0 ? max : 5;
  }, [data]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Velocity & Analytics
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              Discipline Engine
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Quantitative velocity, deep work sessions, GitHub-style activity heatmaps, and DSA mastery radar.
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200/70 dark:border-stone-800/70 text-xs">
          {[
            { label: "90 Days", value: 90 },
            { label: "6 Months", value: 180 },
            { label: "Full Year", value: 365 },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTimeRange(tab.value)}
              className={`px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                timeRange === tab.value
                  ? "bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Deep Work Hours</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono">
              {data ? Math.round((data.total_study_minutes / 60) * 10) / 10 : 0}
            </span>
            <span className="text-xs text-stone-400">
              ({data ? Math.round((data.weekly_study_minutes / 60) * 10) / 10 : 0}h this week)
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Discipline Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {data?.current_streak_days || 0}
            </span>
            <span className="text-xs text-stone-400">days active</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Tasks Shipped</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono">
              {data?.total_tasks_completed || 0}
            </span>
            <span className="text-xs text-stone-400">tasks done</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">DSA Mastered</span>
            <Code2 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono">
              {data?.total_dsa_solved || 0}
            </span>
            <span className="text-xs text-stone-400">problems</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: GITHUB-STYLE ACTIVITY & DISCIPLINE HEATMAP */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Activity & Discipline Matrix
            </h3>
            <span className="text-[10px] text-stone-400">
              (Aggregates Deep Work, Completed Tasks, Habit Check-ins & DSA)
            </span>
          </div>

          {hoveredDay ? (
            <div className="text-xs font-mono text-amber-600 dark:text-amber-400 font-medium">
              {hoveredDay.date}: {hoveredDay.tasks_completed} tasks, {hoveredDay.habits_completed} habits, {hoveredDay.study_minutes}m focus
            </div>
          ) : (
            <span className="text-[10px] text-stone-400">Hover square to inspect</span>
          )}
        </div>

        {/* Heatmap Grid Track */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-1 items-start min-w-[700px]">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3.5 h-3.5 rounded-xs transition-all duration-150 cursor-pointer hover:scale-125 hover:z-10 ${
                      LEVEL_COLORS[day.level] || LEVEL_COLORS[0]
                    }`}
                    title={`${day.date}: ${day.count} activity points`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap Legend */}
        <div className="flex items-center justify-between text-[11px] text-stone-400 pt-3 border-t border-stone-200/60 dark:border-stone-800/60 mt-2">
          <span>{timeRange} days of recorded execution</span>
          <div className="flex items-center gap-1.5">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((lvl) => (
              <div
                key={lvl}
                className={`w-3 h-3 rounded-xs ${LEVEL_COLORS[lvl]}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: 7-DAY VELOCITY & DSA MASTERY RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weekly Deep Work Velocity */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                Weekly Deep Work Velocity (Past 7 Days)
              </h3>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">Hours / Day</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.weekly_velocity.map((day) => {
              const barHeightPct = Math.min(100, Math.round((day.study_hours / maxWeeklyHours) * 100));

              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-700 dark:text-stone-300 w-10">
                      {day.day_name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                      <span>{day.tasks_completed} tasks</span>
                      <span>•</span>
                      <span>{day.habits_completed} habits</span>
                      <span>•</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {day.study_hours} hrs
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        day.study_hours >= 3
                          ? "bg-amber-500"
                          : day.study_hours > 0
                          ? "bg-stone-600 dark:bg-stone-400"
                          : "bg-transparent"
                      }`}
                      style={{ width: `${barHeightPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DSA Topic Mastery Breakdown */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                DSA Topic Mastery Breakdown
              </h3>
            </div>
            <span className="text-[10px] text-stone-400 font-mono">Solve Ratio</span>
          </div>

          <div className="space-y-3 pt-1">
            {data?.dsa_topics.map((topic) => (
              <div key={topic.topic_id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-stone-800 dark:text-stone-200">
                    {topic.topic_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-stone-400">
                      {topic.solved} solved
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300">
                      {topic.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
