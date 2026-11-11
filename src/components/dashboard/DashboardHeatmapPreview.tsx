import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, Sparkles, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { analyticsService } from "@/services/api";
import { AnalyticsOverview, HeatmapDay } from "@/types/models";

const LEVEL_COLORS: Record<number, string> = {
  0: "bg-stone-100 dark:bg-stone-800/60 border border-stone-200/50 dark:border-stone-800/50 hover:border-stone-400",
  1: "bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/60",
  2: "bg-amber-500/50 border border-amber-500/50 hover:border-amber-500/80",
  3: "bg-amber-500/75 border border-amber-500/70 hover:border-amber-400",
  4: "bg-amber-500 border border-amber-400 shadow-xs hover:border-amber-300",
};

export const DashboardHeatmapPreview: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHeatmap = async () => {
      try {
        const overview = await analyticsService.getAnalyticsOverview(77);
        if (isMounted) setData(overview);
      } catch (e) {
        console.error("Failed to load dashboard heatmap preview:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchHeatmap();
    return () => {
      isMounted = false;
    };
  }, []);

  // Standard arrangement: Group into 7-day columns (weeks)
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

  const activeDaysCount = useMemo(() => {
    if (!data || !data.heatmap_days) return 0;
    return data.heatmap_days.filter((d) => d.count > 0).length;
  }, [data]);

  const streak = data?.current_streak_days ?? 0;
  const weeklyStudyHours = data ? (data.weekly_study_minutes / 60).toFixed(1) : "0.0";

  return (
    <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
            Discipline Heatmap
          </h4>
          {streak > 0 ? (
            <span className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">
              <Flame className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
              {streak}d
            </span>
          ) : (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              Daily Streak
            </span>
          )}
        </div>

        <button
          onClick={() => navigate("/analytics")}
          className="flex items-center gap-0.5 text-[11px] font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition cursor-pointer"
          title="Open full analytics"
        >
          <span>Analytics</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="py-6 text-center text-[11px] text-stone-400">
          Loading heatmap...
        </div>
      ) : (
        <div className="space-y-2">
          {/* Calendar Squares Grid with Standard Cell Arrangement */}
          <div className="overflow-x-auto pb-1.5 scrollbar-none">
            <div className="inline-flex items-start gap-1">
              {/* Standard 7-row Weekday Indicators */}
              <div className="flex flex-col gap-1 text-[9px] font-mono text-stone-400 dark:text-stone-500 pt-[1px] pr-1 select-none shrink-0">
                <span className="h-3 leading-3">Mon</span>
                <span className="h-3 leading-3"></span>
                <span className="h-3 leading-3">Wed</span>
                <span className="h-3 leading-3"></span>
                <span className="h-3 leading-3">Fri</span>
                <span className="h-3 leading-3"></span>
                <span className="h-3 leading-3">Sun</span>
              </div>

              {/* Standard 7-row Week Columns (Unchanged Cell Arrangement) */}
              {heatmapWeeks.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-1 shrink-0">
                  {week.map((day) => {
                    const colorClass = LEVEL_COLORS[day.level] || LEVEL_COLORS[0];
                    const isHovered = hoveredDay?.date === day.date;

                    return (
                      <div
                        key={day.date}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-3 h-3 rounded-xs transition-all duration-150 cursor-pointer ${colorClass} ${
                          isHovered ? "scale-125 z-10 shadow-xs ring-1 ring-amber-400" : ""
                        }`}
                        title={`${day.date}: ${day.count} activity points`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Hover Strip & Legend Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-200/50 dark:border-stone-800/50 text-[10px]">
            {hoveredDay ? (
              <div className="truncate text-stone-700 dark:text-stone-300 font-mono">
                <strong className="text-stone-900 dark:text-stone-100">{hoveredDay.date.slice(5)}</strong>:{" "}
                {hoveredDay.tasks_completed > 0 && `${hoveredDay.tasks_completed} tasks `}
                {hoveredDay.habits_completed > 0 && `${hoveredDay.habits_completed} habits `}
                {hoveredDay.study_minutes > 0 && `${hoveredDay.study_minutes}m `}
                {hoveredDay.dsa_solved > 0 && `${hoveredDay.dsa_solved} DSA `}
                {hoveredDay.count === 0 && "Rest day"}
              </div>
            ) : (
              <div className="text-stone-500 dark:text-stone-400 truncate">
                <span>{activeDaysCount} active days • {weeklyStudyHours}h study</span>
              </div>
            )}

            {/* Mini Legend */}
            <div className="flex items-center gap-1 shrink-0 text-stone-400 text-[9px]">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`w-2 h-2 rounded-[1.5px] ${LEVEL_COLORS[lvl]}`}
                />
              ))}
              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
