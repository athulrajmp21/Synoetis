import React, { useState, useEffect } from "react";
import {
  FolderGit2,
  Plus,
  Search,
  ExternalLink,
  GitBranch,
  Globe,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PriorityIcon } from "@/components/ui/PriorityIcon";
import { projectService } from "@/services/api";
import { ProjectItem } from "@/types/models";

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Project Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTechStack, setNewTechStack] = useState("");
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [newLiveUrl, setNewLiveUrl] = useState("");
  const [newStatus, setNewStatus] = useState("active");
  const [newPriority, setNewPriority] = useState("medium");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (e) {
      console.error("Failed to load projects:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await projectService.createProject({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        tech_stack: newTechStack.trim() || undefined,
        repo_url: newRepoUrl.trim() || undefined,
        live_url: newLiveUrl.trim() || undefined,
        status: newStatus,
        priority: newPriority,
      });

      setProjects((prev) => [created, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewTechStack("");
      setNewRepoUrl("");
      setNewLiveUrl("");
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to create project:", e);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );
    await projectService.updateProjectStatus(id, status);
  };

  const handleDeleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await projectService.deleteProject(id);
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.tech_stack.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" || p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const activeCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const planningCount = projects.filter((p) => p.status === "planning").length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            Engineering Projects
            <FolderGit2 className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Systems software, open source tools, and portfolio applications.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          New Project
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Total Projects
          </span>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {projects.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Active Development
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {activeCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            In Planning
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {planningCount}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
            Shipped / Completed
          </span>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
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
            placeholder="Search by project, tech stack..."
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="flex items-center bg-[#F3EFEA] dark:bg-[#191816] p-0.5 rounded-xl text-xs overflow-x-auto w-full sm:w-auto">
          {["all", "active", "planning", "paused", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <FolderGit2 className="w-9 h-9 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
          <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
            No engineering projects found
          </h4>
          <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto mb-4">
            Add your repositories, systems projects, or web apps to start tracking progress and architecture.
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const isCompleted = p.status === "completed";
            return (
              <div
                key={p.id}
                className="group p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 transition flex flex-col justify-between shadow-xs"
              >
                <div>
                  {/* Top Bar: Priority & Status Selector */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <PriorityIcon priority={p.priority} showLabel={false} />
                      <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                        {p.title}
                      </h3>
                    </div>

                    <select
                      value={p.status}
                      onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer outline-none capitalize ${
                        p.status === "active"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                          : p.status === "planning"
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                          : p.status === "completed"
                          ? "bg-stone-200/80 text-stone-800 dark:bg-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700"
                          : "bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border-stone-200 dark:border-stone-800"
                      }`}
                    >
                      <option value="planning">Planning</option>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <p className="text-xs text-stone-600 dark:text-stone-400 mb-3 line-clamp-2 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Tech Stack Chips */}
                  {p.tech_stack.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 my-3">
                      {p.tech_stack.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-stone-200/60 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/60"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Links & Actions */}
                <div className="pt-3 border-t border-stone-200/60 dark:border-stone-800/60 flex items-center justify-between text-xs mt-3">
                  <div className="flex items-center gap-3">
                    {p.repo_url && (
                      <a
                        href={p.repo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 flex items-center gap-1 transition"
                        title="Open Repository"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Repo</span>
                      </a>
                    )}
                    {p.live_url && (
                      <a
                        href={p.live_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 flex items-center gap-1 transition"
                        title="Open Live App"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Live</span>
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-1 transition cursor-pointer"
                    title="Delete project"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                New Engineering Project
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Key-Value Store in Rust"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Description
                </label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Goals, architecture notes, or key capabilities..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tech Stack (Comma-separated)
                </label>
                <input
                  type="text"
                  value={newTechStack}
                  onChange={(e) => setNewTechStack(e.target.value)}
                  placeholder="e.g. Rust, Tokio, Raft, Docker, gRPC"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Repository URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newRepoUrl}
                    onChange={(e) => setNewRepoUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Live Demo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newLiveUrl}
                    onChange={(e) => setNewLiveUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active Development</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed / Shipped</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
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
                  Save Project
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
