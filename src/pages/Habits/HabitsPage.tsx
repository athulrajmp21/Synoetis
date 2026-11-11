import React, { useState, useEffect } from "react";
import {
  Flame,
  Plus,
  Check,
  Trash2,
  Calendar,
  Sparkles,
  TrendingUp,
  X,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { habitService } from "@/services/api";
import { HabitItem } from "@/types/models";

export const HabitsPage: React.FC = () => {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Add Habit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Productivity");

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    try {
      setLoading(true);
      const data = await habitService.getHabits();
      setHabits(data);
    } catch (e) {
      console.error("Failed to load habits:", e);
    } finally {
      setLoading(false);
    }
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
    if (!newTitle.trim()) return;

    try {
      const created = await habitService.createHabit({
        title: newTitle.trim(),
        category: newCategory.toLowerCase(),
      });

      setHabits((prev) => [...prev, created]);
      setNewTitle("");
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to add habit:", e);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    await habitService.deleteHabit(id);
  };

  const filteredHabits = habits.filter((h) => {
    if (categoryFilter === "all") return true;
    return h.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const completedToday = habits.filter((h) => h.is_completed_today).length;
  const completionRate =
    habits.length > 0 ? Math.round((completedToday / habits.length) * 100) : 0;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Habits & Disciplines
            <Flame className="w-5 h-5 text-amber-500" />
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Daily consistency tracking for coding routines, deep study sessions, and physical fitness.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Habit
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Total Habits
          </span>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {habits.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Today&apos;s Completion
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {completionRate}%
            <span className="text-xs font-normal text-stone-400 ml-1">
              ({completedToday}/{habits.length})
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Best Active Streak
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {bestStreak} <span className="text-xs font-normal text-stone-400">days</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Daily Status
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {completedToday === habits.length && habits.length > 0 ? "Complete" : "In Progress"}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {["all", "productivity", "study", "health", "coding"].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition cursor-pointer ${
              categoryFilter === cat
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                : "bg-[#F3EFEA] dark:bg-[#191816] text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Habits List */}
      <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs">
        {filteredHabits.length === 0 ? (
          <div className="py-12 text-center">
            <Flame className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
            <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              No habits found
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto mb-4">
              Add your daily rituals (e.g. Solve 1 DSA Problem, 2 Hours Focus Study, Read Tech Blogs).
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Habit
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200/50 dark:divide-stone-800/50">
            {filteredHabits.map((habit) => (
              <div
                key={habit.id}
                className="group p-4 flex items-center justify-between hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-4">
                  <button
                    onClick={() => handleToggleHabit(habit.id)}
                    className={`w-6 h-6 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                      habit.is_completed_today
                        ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                        : "border border-stone-300 dark:border-stone-700 hover:border-stone-500 bg-white dark:bg-[#0C0B0A]"
                    }`}
                    title={habit.is_completed_today ? "Completed today" : "Mark done today"}
                  >
                    {habit.is_completed_today && <Check className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <span
                      className={`text-xs font-medium block truncate ${
                        habit.is_completed_today
                          ? "line-through text-stone-400 dark:text-stone-500"
                          : "text-stone-900 dark:text-stone-100"
                      }`}
                    >
                      {habit.title}
                    </span>
                    <span className="text-[10px] text-stone-400 capitalize">
                      {habit.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-mono font-medium">
                    <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                    <span>{habit.streak} days</span>
                  </div>

                  <button
                    onClick={() => handleDeleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-1 transition cursor-pointer"
                    title="Delete habit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Create New Habit
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Habit Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Solve 1 LeetCode Problem"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                >
                  <option value="Productivity">Productivity</option>
                  <option value="Study">Study & Academics</option>
                  <option value="Coding">Coding & Systems</option>
                  <option value="Health">Health & Fitness</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs border-stone-200 dark:border-stone-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  Save Habit
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
