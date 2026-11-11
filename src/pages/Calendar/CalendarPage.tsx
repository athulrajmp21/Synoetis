import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  X,
  CalendarCheck,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { taskService, academicService } from "@/services/api";
import { Task, AssessmentItem } from "@/types/models";

interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  category: "academic" | "task" | "custom" | "exam";
  status?: string;
}

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  });

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [customEvents, setCustomEvents] = useState<CalendarEvent[]>(() => {
    try {
      const saved = localStorage.getItem("lifeos_calendar_events");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Add Event Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState(selectedDateStr);
  const [newEventTime, setNewEventTime] = useState("10:00");
  const [newEventCategory, setNewEventCategory] = useState<"custom" | "exam" | "academic">("custom");

  // Load tasks & assessments to display on calendar
  const loadData = async () => {
    try {
      const [tasks, assessments] = await Promise.all([
        taskService.getTasks(),
        academicService.getAssessments(),
      ]);

      const aggregated: CalendarEvent[] = [];

      // Map tasks with due_date
      tasks.forEach((t) => {
        if (t.due_date) {
          aggregated.push({
            id: `task-${t.id}`,
            title: t.title,
            date: t.due_date.slice(0, 10),
            category: "task",
            status: t.status,
          });
        }
      });

      // Map assessments with due_date
      assessments.forEach((a) => {
        if (a.due_date) {
          aggregated.push({
            id: `assessment-${a.id}`,
            title: `${a.title} (${a.course_title})`,
            date: a.due_date.slice(0, 10),
            category: a.assessment_type === "midterm" || a.assessment_type === "final" ? "exam" : "academic",
            status: a.status,
          });
        }
      });

      // Append custom events
      setEvents([...aggregated, ...customEvents]);
    } catch (e) {
      console.error("Failed to load calendar events:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, [customEvents]);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Shift Monday to first col (0 = Mon, 6 = Sun)
  const startOffset = (firstDayOfMonth + 6) % 7;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate()
      ).padStart(2, "0")}`
    );
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleAddEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEv: CalendarEvent = {
      id: crypto.randomUUID(),
      title: newEventTitle.trim(),
      date: newEventDate,
      time: newEventTime,
      category: newEventCategory,
    };

    const updated = [newEv, ...customEvents];
    setCustomEvents(updated);
    localStorage.setItem("lifeos_calendar_events", JSON.stringify(updated));
    setNewEventTitle("");
    setIsAddModalOpen(false);
  };

  // Events for selected date
  const selectedDayEvents = events.filter((e) => e.date === selectedDateStr);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  })();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Unified Calendar
            <CalendarIcon className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Synchronized schedule across assignments, exams, project milestones, and personal tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs border-stone-200 dark:border-stone-800"
          >
            Today
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setNewEventDate(selectedDateStr);
              setIsAddModalOpen(true);
            }}
            className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Main Grid & Agenda View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
            <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
              {monthNames[month]} {year}
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span
                key={day}
                className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider py-1"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Days Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Prev month days */}
            {Array.from({ length: startOffset }).map((_, i) => {
              const dayNum = prevMonthDays - startOffset + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-20 p-1.5 rounded-xl border border-stone-200/30 dark:border-stone-800/30 opacity-30 text-[11px] text-stone-400"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                day
              ).padStart(2, "0")}`;
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDateStr;
              const dayEvents = events.filter((e) => e.date === dateStr);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`h-20 p-2 rounded-xl text-left border flex flex-col justify-between transition cursor-pointer ${
                    isSelected
                      ? "border-stone-900 bg-stone-100/90 dark:border-stone-100 dark:bg-stone-800/60 shadow-xs ring-1 ring-stone-900/10 dark:ring-stone-100/10"
                      : "border-stone-200/60 dark:border-stone-800/60 bg-white dark:bg-[#0C0B0A] hover:border-stone-300 dark:hover:border-stone-700"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center ${
                        isToday
                          ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                          : "text-stone-800 dark:text-stone-200"
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-mono font-medium text-stone-500 dark:text-stone-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Micro event indicator dots / pills */}
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className={`text-[9px] truncate px-1 py-0.2 rounded font-medium ${
                          ev.category === "exam"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                            : ev.category === "academic"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {ev.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[8px] text-stone-400">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Sidebar (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/60 mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-stone-700 dark:text-stone-300" />
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Agenda for {selectedDateStr}
                </h3>
              </div>
              <span className="text-[11px] font-mono text-stone-400">
                {selectedDayEvents.length} items
              </span>
            </div>

            {selectedDayEvents.length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="w-7 h-7 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  No scheduled exams, tasks, or milestones for this date.
                </p>
                <button
                  onClick={() => {
                    setNewEventDate(selectedDateStr);
                    setIsAddModalOpen(true);
                  }}
                  className="mt-3 text-xs text-stone-700 dark:text-stone-300 font-medium underline underline-offset-2 hover:opacity-80 transition cursor-pointer"
                >
                  Schedule something
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/60 dark:border-stone-800/60 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${
                          ev.category === "exam"
                            ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                            : ev.category === "academic"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                            : "bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300"
                        }`}
                      >
                        {ev.category}
                      </span>
                      {ev.time && (
                        <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.time}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                      {ev.title}
                    </span>
                    {ev.status && (
                      <span className="text-[10px] text-stone-400 capitalize">
                        Status: {ev.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setNewEventDate(selectedDateStr);
              setIsAddModalOpen(true);
            }}
            className="w-full mt-6 py-2 px-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event to this Day</span>
          </button>
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Schedule New Event
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEventSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Event / Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Lab Submission"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Category
                </label>
                <select
                  value={newEventCategory}
                  onChange={(e) => setNewEventCategory(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                >
                  <option value="custom">General Milestone</option>
                  <option value="exam">Exam / Test</option>
                  <option value="academic">Academic Assignment</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-xs border-stone-200 dark:border-stone-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  Schedule Event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
