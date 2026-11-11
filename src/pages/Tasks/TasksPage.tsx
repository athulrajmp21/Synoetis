import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Search,
  Tag,
  Clock,
  Circle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { taskService } from "@/services/api";
import { Task } from "@/types/models";

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("pending");

  // Create Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newDueDate, setNewDueDate] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (e) {
      console.error("Failed to load tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "done" ? "todo" : "done";
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextStatus as any } : t))
    );
    await taskService.updateTaskStatus(id, nextStatus);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await taskService.createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        category: newCategory,
        priority: newPriority,
        due_date: newDueDate.trim() || undefined,
      });

      setTasks((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewDueDate("");
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to create task:", e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await taskService.deleteTask(id);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || t.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesPriority =
      selectedPriority === "all" || t.priority.toLowerCase() === selectedPriority.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && t.status !== "done") ||
      (statusFilter === "completed" && t.status === "done");

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
  });

  const pendingCount = tasks.filter((t) => t.status !== "done").length;
  const completedCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Tasks Hub
            <CheckSquare className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Minimalist Linear-style issue tracking and daily priorities.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          New Task
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Total
          </span>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {tasks.length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Pending
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Completed
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {completedCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300 focus:outline-hidden"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Tabs */}
          <div className="flex items-center bg-[#F3EFEA] dark:bg-[#191816] p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              All ({tasks.length})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "completed"
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center">
            <CheckSquare className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
            <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              No tasks found
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto mb-4">
              {statusFilter === "completed"
                ? "No completed tasks yet. Finish a task to see it here!"
                : "Create your first task to start organizing your workflow."}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Task
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200/50 dark:divide-stone-800/50">
            {filteredTasks.map((task) => {
              const isDone = task.status === "done";
              return (
                <div
                  key={task.id}
                  className="group p-3.5 flex items-start justify-between hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                    <button
                      onClick={() => handleToggleTask(task.id, task.status)}
                      className="mt-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition shrink-0 cursor-pointer"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <PriorityIcon priority={task.priority} showLabel={false} />
                        <span
                          className={`text-xs font-medium truncate ${
                            isDone
                              ? "line-through text-stone-400 dark:text-stone-500"
                              : "text-stone-900 dark:text-stone-100"
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400 dark:text-stone-500">
                        <span className="flex items-center gap-1 capitalize">
                          <Tag className="w-3 h-3" />
                          {task.category}
                        </span>
                        {task.due_date && (
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3" />
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-1 transition shrink-0 cursor-pointer"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Create New Task
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement Dijkstra's algorithm"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Add notes, links, or context..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="General, Academic, Project"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                />
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
                  Save Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
