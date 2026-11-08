import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Filter,
  Check,
  Search,
  Tag,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  category: "DSA Practice" | "Academic OS" | "Projects" | "Career" | "General";
  priority: "Urgent" | "High" | "Medium" | "Low";
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "tsk-1",
    title: "Solve 3 LeetCode Mediums on Dynamic Programming",
    description: "Coin change problem, Longest Common Subsequence, and 0/1 Knapsack.",
    category: "DSA Practice",
    priority: "High",
    dueDate: "Today",
    completed: false,
    createdAt: "Nov 08",
  },
  {
    id: "tsk-2",
    title: "Review Operating Systems Chapter 4 (Process Synchronization)",
    description: "Peterson's solution, Semaphores, Mutexes, and Deadlock avoidance bankers algorithm.",
    category: "Academic OS",
    priority: "Medium",
    dueDate: "Today",
    completed: false,
    createdAt: "Nov 07",
  },
  {
    id: "tsk-3",
    title: "Implement Notion-Style Block Editor in Knowledge Hub",
    description: "Support draggable blocks, markdown export, and slash commands.",
    category: "Projects",
    priority: "Urgent",
    dueDate: "Today",
    completed: true,
    createdAt: "Nov 06",
  },
  {
    id: "tsk-4",
    title: "Submit Software Engineering Lab #3 Report",
    description: "Complete class diagrams, sequence diagrams, and architecture document.",
    category: "Academic OS",
    priority: "Urgent",
    dueDate: "Nov 09",
    completed: false,
    createdAt: "Nov 05",
  },
  {
    id: "tsk-5",
    title: "Update Resume with Life OS Rust & Tauri Experience",
    description: "Document local-first SQLite architecture and performance numbers.",
    category: "Career",
    priority: "High",
    dueDate: "Nov 12",
    completed: false,
    createdAt: "Nov 05",
  },
  {
    id: "tsk-6",
    title: "Benchmark SQLite WAL Mode Read/Write Throughput",
    description: "Measure latency across 10,000 transaction batches.",
    category: "Projects",
    priority: "Low",
    dueDate: "Nov 15",
    completed: false,
    createdAt: "Nov 04",
  },
];

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("lifeos_all_tasks");
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // New task form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<TaskItem["category"]>("DSA Practice");
  const [newPriority, setNewPriority] = useState<TaskItem["priority"]>("Medium");
  const [newDueDate, setNewDueDate] = useState("Today");

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem("lifeos_all_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Toggle completion
  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Add task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      category: newCategory,
      priority: newPriority,
      dueDate: newDueDate,
      completed: false,
      createdAt: "Today",
    };

    setTasks([newTask, ...tasks]);
    setNewTitle("");
    setNewDesc("");
    setShowAddModal(false);
  };

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter === "pending" && t.completed) return false;
    if (statusFilter === "completed" && !t.completed) return false;
    if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              My Tasks
            </h1>
            <Badge variant="accent" size="sm">
              {pendingCount} Pending
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Organize priorities across DSA preparation, academics, and projects.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>New Task</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/50">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Status Tabs */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === "pending"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                statusFilter === "completed"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              Done ({completedCount})
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="DSA Practice">DSA Practice</option>
            <option value="Academic OS">Academic OS</option>
            <option value="Projects">Projects</option>
            <option value="Career">Career</option>
            <option value="General">General</option>
          </select>

          {/* Priority Dropdown */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Task Creation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Create New Task
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Add details, links, or notes..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) =>
                      setNewCategory(e.target.value as TaskItem["category"])
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="DSA Practice">DSA Practice</option>
                    <option value="Academic OS">Academic OS</option>
                    <option value="Projects">Projects</option>
                    <option value="Career">Career</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as TaskItem["priority"])
                    }
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="text"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    placeholder="Today, Nov 12..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Create Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No tasks found matching your filters.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start justify-between p-3.5 rounded-xl border transition-all ${
                task.completed
                  ? "border-slate-100 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-900/20 opacity-75"
                  : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <button
                  onClick={() => handleToggleTask(task.id)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    task.completed
                      ? "bg-emerald-500 text-white border border-emerald-500"
                      : "border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500"
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="min-w-0">
                  <p
                    onClick={() => handleToggleTask(task.id)}
                    className={`text-sm cursor-pointer select-none leading-snug ${
                      task.completed
                        ? "line-through text-slate-400 dark:text-slate-500"
                        : "font-semibold text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    {task.title}
                  </p>

                  {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 mt-2.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400">
                      <Tag className="w-3 h-3" /> {task.category}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due {task.dueDate}
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
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
