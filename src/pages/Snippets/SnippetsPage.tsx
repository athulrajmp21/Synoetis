import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Terminal,
  Search,
  Plus,
  Star,
  Copy,
  Check,
  Trash2,
  Edit3,
  Download,
  Filter,
  Sparkles,
  Zap,
  Code2,
  FolderGit2,
  Database,
  Layers,
  ChevronRight,
  X,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { snippetsService } from "@/services/api";
import { SnippetItem, CreateSnippetInput, UpdateSnippetInput } from "@/types/models";

const CATEGORIES = [
  { id: "all", label: "All Snippets" },
  { id: "favorites", label: "⭐ Favorites" },
  { id: "git", label: "Git" },
  { id: "docker", label: "Docker" },
  { id: "linux", label: "Linux / Bash" },
  { id: "sql", label: "SQL & SQLite" },
  { id: "rust", label: "Rust" },
  { id: "react", label: "React / TS" },
  { id: "python", label: "Python" },
  { id: "regex", label: "Regex" },
  { id: "general", label: "General" },
];

const LANGUAGES = [
  "bash",
  "dockerfile",
  "sql",
  "rust",
  "typescript",
  "javascript",
  "python",
  "regex",
  "json",
  "yaml",
  "markdown",
];

export const SnippetsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("id");

  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<SnippetItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formLanguage, setFormLanguage] = useState("bash");
  const [formCategory, setFormCategory] = useState("general");
  const [formTags, setFormTags] = useState("");
  const [formIsFavorite, setFormIsFavorite] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Export state
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    loadSnippets();
  }, []);

  const loadSnippets = async () => {
    setLoading(true);
    try {
      const data = await snippetsService.getSnippets();
      setSnippets(data);
    } catch (e) {
      console.error("Failed to load snippets:", e);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to highlighted snippet if opened from Omnisearch
  useEffect(() => {
    if (highlightId && cardRefs.current[highlightId]) {
      setTimeout(() => {
        cardRefs.current[highlightId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);
    }
  }, [highlightId, snippets]);

  const handleCopyCode = async (snippet: SnippetItem) => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopiedSnippetId(snippet.id);
      setTimeout(() => setCopiedSnippetId(null), 2000);

      // Increment usage count in SQLite
      await snippetsService.incrementUsage(snippet.id);
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === snippet.id ? { ...s, usage_count: s.usage_count + 1 } : s
        )
      );
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleToggleFavorite = async (snippet: SnippetItem) => {
    try {
      const newFav = await snippetsService.toggleFavorite(snippet.id);
      setSnippets((prev) =>
        prev.map((s) =>
          s.id === snippet.id ? { ...s, is_favorite: newFav } : s
        )
      );
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this snippet?")) return;
    try {
      await snippetsService.deleteSnippet(id);
      setSnippets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to delete snippet:", err);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingSnippet(null);
    setFormTitle("");
    setFormDesc("");
    setFormCode("");
    setFormLanguage("bash");
    setFormCategory(activeCategory !== "all" && activeCategory !== "favorites" ? activeCategory : "general");
    setFormTags("");
    setFormIsFavorite(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (snippet: SnippetItem) => {
    setEditingSnippet(snippet);
    setFormTitle(snippet.title);
    setFormDesc(snippet.description || "");
    setFormCode(snippet.code);
    setFormLanguage(snippet.language);
    setFormCategory(snippet.category);
    setFormTags(snippet.tags.join(", "));
    setFormIsFavorite(snippet.is_favorite);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!formCode.trim()) {
      setFormError("Snippet code or command is required.");
      return;
    }

    try {
      if (editingSnippet) {
        const input: UpdateSnippetInput = {
          id: editingSnippet.id,
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          code: formCode.trim(),
          language: formLanguage,
          category: formCategory,
          tags: formTags.trim() || undefined,
          is_favorite: formIsFavorite,
        };
        const updated = await snippetsService.updateSnippet(input);
        setSnippets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const input: CreateSnippetInput = {
          title: formTitle.trim(),
          description: formDesc.trim() || undefined,
          code: formCode.trim(),
          language: formLanguage,
          category: formCategory,
          tags: formTags.trim() || undefined,
          is_favorite: formIsFavorite,
        };
        const created = await snippetsService.createSnippet(input);
        setSnippets((prev) => [created, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to save snippet:", err);
      setFormError("Failed to save snippet to SQLite database.");
    }
  };

  const handleExportJson = async () => {
    try {
      const json = await snippetsService.exportJson();
      await navigator.clipboard.writeText(json);
      setExportNotice("All snippets copied to clipboard as JSON!");
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err) {
      console.error("Failed to export snippets:", err);
    }
  };

  // Filtered snippets
  const filteredSnippets = useMemo(() => {
    return snippets.filter((s) => {
      // Category filter
      if (activeCategory === "favorites" && !s.is_favorite) return false;
      if (activeCategory !== "all" && activeCategory !== "favorites" && s.category.toLowerCase() !== activeCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = s.title.toLowerCase().includes(q);
        const descMatch = s.description?.toLowerCase().includes(q);
        const codeMatch = s.code.toLowerCase().includes(q);
        const langMatch = s.language.toLowerCase().includes(q);
        const tagMatch = s.tags.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !descMatch && !codeMatch && !langMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });
  }, [snippets, activeCategory, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = snippets.length;
    const favoriteCount = snippets.filter((s) => s.is_favorite).length;
    const totalUsage = snippets.reduce((acc, s) => acc + s.usage_count, 0);
    const categoriesCount = new Set(snippets.map((s) => s.category.toLowerCase())).size;

    return { totalCount, favoriteCount, totalUsage, categoriesCount };
  }, [snippets]);

  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case "bash":
        return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30";
      case "dockerfile":
        return "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30";
      case "sql":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
      case "rust":
        return "bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30";
      case "typescript":
      case "javascript":
        return "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30";
      case "python":
        return "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/30";
      case "regex":
        return "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30";
      default:
        return "bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300/40 dark:border-stone-700/40";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Developer Snippet Vault
                <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono font-normal">
                  {stats.totalCount} recipes
                </span>
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Instant-copy shell one-liners, Docker recipes, Git commands, regex patterns, and code templates.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJson}
            className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300"
            title="Copy all snippets to clipboard as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Snippet</span>
          </Button>
        </div>
      </div>

      {/* Export feedback notice */}
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-[#121110]/70">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Total Snippets</div>
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100 font-mono mt-1">
            {stats.totalCount}
          </div>
        </Card>
        <Card className="p-3.5 border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-[#121110]/70">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Favorite Recipes</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{stats.favoriteCount}</span>
          </div>
        </Card>
        <Card className="p-3.5 border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-[#121110]/70">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Times Copied / Used</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span>{stats.totalUsage}</span>
          </div>
        </Card>
        <Card className="p-3.5 border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-[#121110]/70">
          <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Categories</div>
          <div className="text-xl font-bold text-stone-900 dark:text-stone-100 font-mono mt-1">
            {stats.categoriesCount}
          </div>
        </Card>
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search commands by title, description, code, language, or tags (e.g. undo, prune, lsof)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 p-1 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count =
              cat.id === "all"
                ? snippets.length
                : cat.id === "favorites"
                ? snippets.filter((s) => s.is_favorite).length
                : snippets.filter((s) => s.category.toLowerCase() === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30 shadow-2xs"
                    : "bg-white dark:bg-[#121110] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700"
                }`}
              >
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-60 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Snippets Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 animate-pulse text-amber-500" />
          <span>Loading developer snippet vault...</span>
        </div>
      ) : filteredSnippets.length === 0 ? (
        <div className="py-16 text-center text-stone-400 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl p-8">
          <Terminal className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            No snippets match your filter
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Try adjusting your search query or click &ldquo;New Snippet&rdquo; to add a new command.
          </p>
          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="mt-4 text-xs bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add First Snippet
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSnippets.map((snippet) => {
            const isCopied = copiedSnippetId === snippet.id;
            const isHighlighted = highlightId === snippet.id;

            return (
              <div
                key={snippet.id}
                ref={(el) => {
                  cardRefs.current[snippet.id] = el;
                }}
                className={`group rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                  isHighlighted
                    ? "ring-2 ring-amber-500 border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 shadow-lg"
                    : "border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#121110] hover:border-stone-300 dark:hover:border-stone-700 shadow-xs"
                }`}
              >
                {/* Card Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-semibold tracking-wider uppercase ${getLanguageColor(
                            snippet.language
                          )}`}
                        >
                          {snippet.language}
                        </span>

                        <span className="text-[10px] font-mono uppercase text-stone-400">
                          {snippet.category}
                        </span>

                        {snippet.usage_count > 0 && (
                          <span className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            {snippet.usage_count} {snippet.usage_count === 1 ? "use" : "uses"}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-tight">
                        {snippet.title}
                      </h3>

                      {snippet.description && (
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">
                          {snippet.description}
                        </p>
                      )}
                    </div>

                    {/* Star Favorite Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(snippet)}
                      className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                        snippet.is_favorite
                          ? "text-amber-500 hover:text-amber-600 bg-amber-500/10"
                          : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                      }`}
                      title={snippet.is_favorite ? "Unmark Favorite" : "Mark as Favorite"}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          snippet.is_favorite ? "fill-amber-500 text-amber-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Tags */}
                  {snippet.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                      {snippet.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 border border-stone-200/60 dark:border-stone-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Monospace Code Preview Box */}
                <div className="px-4 pb-3">
                  <div className="relative group/code rounded-xl overflow-hidden border border-stone-200/90 dark:border-stone-800/90 bg-[#F5F2EB] dark:bg-[#0A0908]">
                    <pre className="p-3 text-[11px] font-mono text-stone-900 dark:text-stone-100 overflow-x-auto whitespace-pre leading-relaxed no-scrollbar select-all">
                      <code>{snippet.code}</code>
                    </pre>

                    {/* Big Floating 1-Click Copy Button */}
                    <button
                      type="button"
                      onClick={() => handleCopyCode(snippet)}
                      className={`absolute right-2 top-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition cursor-pointer shadow-xs ${
                        isCopied
                          ? "bg-emerald-600 text-white border border-emerald-500"
                          : "bg-white/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-200 border border-stone-200/80 dark:border-stone-700/80 hover:bg-amber-500 hover:text-white hover:border-amber-500"
                      }`}
                      title="Copy code to clipboard"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-2 border-t border-stone-100 dark:border-stone-800/60 bg-stone-50/50 dark:bg-stone-900/30 flex items-center justify-between text-[11px] text-stone-400">
                  <span className="font-mono text-[10px]">
                    {snippet.code.split("\n").length} {snippet.code.split("\n").length === 1 ? "line" : "lines"}
                  </span>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(snippet)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
                      title="Edit snippet"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(snippet.id)}
                      className="p-1 rounded text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      title="Delete snippet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Snippet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[#FAF8F5] dark:bg-[#121110] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  {editingSnippet ? "Edit Snippet / Cheat Sheet" : "New Snippet / Cheat Sheet"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-4 space-y-4">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Title / Action Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Undo last commit (keep staged changes)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              {/* Category and Language Select */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50 capitalize"
                  >
                    {CATEGORIES.filter((c) => c.id !== "all" && c.id !== "favorites").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Syntax / Language
                  </label>
                  <select
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50 uppercase font-mono"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Description / Explanation (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rewinds HEAD without discarding your index changes."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Code / Command *
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="git reset --soft HEAD~1"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0A0908] text-stone-900 dark:text-stone-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500/50 leading-relaxed"
                />
              </div>

              {/* Tags & Favorite Checkbox */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-stone-600 dark:text-stone-400 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="git, undo, reset, commit"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500/50 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="modal-fav"
                    checked={formIsFavorite}
                    onChange={(e) => setFormIsFavorite(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-stone-300 dark:border-stone-700"
                  />
                  <label htmlFor="modal-fav" className="text-xs font-medium text-stone-700 dark:text-stone-300 cursor-pointer">
                    Add to Favorites ⭐
                  </label>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200/80 dark:border-stone-800/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  {editingSnippet ? "Save Changes" : "Create Snippet"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
