import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Library,
  Plus,
  Search,
  BookOpen,
  FileText,
  Video,
  Globe,
  GraduationCap,
  Star,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  Bookmark,
  ChevronDown,
  ChevronUp,
  FolderUp,
  FolderOpen,
  Files,
  FileCode,
  HardDrive,
  Check,
  Layers,
  ArrowRight,
  Columns2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { resourceService } from "@/services/api";
import {
  ResourceItem,
  CreateResourceInput,
  ResourceType,
  LearningStatus,
  SelectedFileInfo,
} from "@/types/models";

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }
> = {
  book: {
    label: "Textbook / Book",
    icon: BookOpen,
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  },
  paper: {
    label: "Research Paper",
    icon: FileText,
    badgeClass: "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30",
  },
  documentation: {
    label: "Official Docs",
    icon: Globe,
    badgeClass: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
  },
  course: {
    label: "Course / MOOC",
    icon: GraduationCap,
    badgeClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
  },
  video: {
    label: "Video / Talk",
    icon: Video,
    badgeClass: "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30",
  },
  tutorial: {
    label: "Tutorial / Deep Dive",
    icon: Sparkles,
    badgeClass: "bg-stone-500/15 text-stone-800 dark:text-stone-300 border-stone-500/30",
  },
  article: {
    label: "Engineering Blog",
    icon: FileText,
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
  },
};

const STATUS_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  to_read: {
    label: "To Read",
    badgeClass: "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400",
  },
  in_progress: {
    label: "Reading / In Progress",
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/20",
  },
  completed: {
    label: "Finished & Archived",
    badgeClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20",
  },
};

interface BatchImportItem {
  id: string;
  path: string;
  title: string;
  file_name: string;
  extension: string;
  file_size_bytes: number;
  resource_type: string;
  author: string;
  learning_status: string;
  rating: number;
  notes: string;
}

function inferResourceType(ext: string): string {
  const e = ext.toLowerCase();
  if (["pdf", "epub", "djvu", "mobi"].includes(e)) return "book";
  if (["mp4", "mkv", "webm", "mov", "avi"].includes(e)) return "video";
  if (["md", "txt", "docx", "doc"].includes(e)) return "documentation";
  if (["rs", "py", "ts", "tsx", "js", "go", "cpp", "c", "java", "sql"].includes(e)) return "tutorial";
  return "book";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function cleanFileName(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  const name = lastDot > 0 ? fileName.substring(0, lastDot) : fileName;
  return name.replace(/[_-]+/g, " ").trim();
}

function isLocalPath(url?: string | null): boolean {
  if (!url) return false;
  return !url.startsWith("http://") && !url.startsWith("https://");
}

export const ResourcesPage: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Expanded notes per card ID
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Single Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<CreateResourceInput>({
    title: "",
    resource_type: "book",
    url: "",
    author: "",
    learning_status: "in_progress",
    rating: 5,
    notes: "",
  });

  // Batch Multi-File Modal State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchItems, setBatchItems] = useState<BatchImportItem[]>([]);
  const [isBatchSaving, setIsBatchSaving] = useState(false);

  const loadData = async () => {
    try {
      const data = await resourceService.getResources();
      setResources(data);
    } catch (e) {
      console.error("Failed to load resources:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      if (selectedStatus !== "all" && r.learning_status !== selectedStatus) return false;
      if (selectedType !== "all" && r.resource_type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchAuthor = r.author && r.author.toLowerCase().includes(q);
        const matchNotes = r.notes && r.notes.toLowerCase().includes(q);
        const matchUrl = r.url && r.url.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchNotes && !matchUrl) return false;
      }
      return true;
    });
  }, [resources, selectedStatus, selectedType, searchQuery]);

  const metrics = useMemo(() => {
    const total = resources.length;
    const inProgress = resources.filter((r) => r.learning_status === "in_progress").length;
    const completed = resources.filter((r) => r.learning_status === "completed").length;
    const toRead = resources.filter((r) => r.learning_status === "to_read").length;
    const localFilesCount = resources.filter((r) => isLocalPath(r.url)).length;
    return { total, inProgress, completed, toRead, localFilesCount };
  }, [resources]);

  // Open native multi-file picker
  const handleSelectMultipleFiles = async () => {
    try {
      const picked = await resourceService.pickLocalFiles();
      if (!picked || picked.length === 0) return;

      const newBatch: BatchImportItem[] = picked.map((f, idx) => ({
        id: `batch-${Date.now()}-${idx}-${Math.random()}`,
        path: f.path,
        title: cleanFileName(f.file_name),
        file_name: f.file_name,
        extension: f.extension,
        file_size_bytes: f.file_size_bytes,
        resource_type: inferResourceType(f.extension),
        author: "",
        learning_status: "in_progress",
        rating: 5,
        notes: `Local file: ${f.file_name} (${formatBytes(f.file_size_bytes)})`,
      }));

      setBatchItems(newBatch);
      setIsBatchModalOpen(true);
      if (isModalOpen) setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to pick local files:", e);
    }
  };

  // Add more files to existing batch
  const handleAddMoreFilesToBatch = async () => {
    try {
      const picked = await resourceService.pickLocalFiles();
      if (!picked || picked.length === 0) return;

      const additional: BatchImportItem[] = picked.map((f, idx) => ({
        id: `batch-${Date.now()}-${idx}-${Math.random()}`,
        path: f.path,
        title: cleanFileName(f.file_name),
        file_name: f.file_name,
        extension: f.extension,
        file_size_bytes: f.file_size_bytes,
        resource_type: inferResourceType(f.extension),
        author: "",
        learning_status: "in_progress",
        rating: 5,
        notes: `Local file: ${f.file_name} (${formatBytes(f.file_size_bytes)})`,
      }));

      setBatchItems((prev) => [...prev, ...additional]);
    } catch (e) {
      console.error("Failed to add files:", e);
    }
  };

  // Save all items from batch import
  const handleSaveBatch = async () => {
    if (batchItems.length === 0) return;
    setIsBatchSaving(true);
    try {
      const inputs: CreateResourceInput[] = batchItems.map((b) => ({
        title: b.title.trim() || b.file_name,
        resource_type: b.resource_type,
        url: b.path,
        author: b.author.trim() ? b.author.trim() : undefined,
        learning_status: b.learning_status,
        rating: b.rating,
        notes: b.notes.trim() ? b.notes.trim() : undefined,
      }));

      const createdList = await resourceService.createResourcesBatch(inputs);
      setResources((prev) => [...createdList, ...prev]);
      setIsBatchModalOpen(false);
      setBatchItems([]);
    } catch (e) {
      console.error("Failed to batch import resources:", e);
    } finally {
      setIsBatchSaving(false);
    }
  };

  // Apply common status to all batch items
  const handleBatchSetStatus = (status: string) => {
    setBatchItems((prev) => prev.map((item) => ({ ...item, learning_status: status })));
  };

  // Apply common type to all batch items
  const handleBatchSetType = (type: string) => {
    setBatchItems((prev) => prev.map((item) => ({ ...item, resource_type: type })));
  };

  // Remove one item from batch
  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle single resource create
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      const created = await resourceService.createResource(form);
      setResources((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setForm({
        title: "",
        resource_type: "book",
        url: "",
        author: "",
        learning_status: "in_progress",
        rating: 5,
        notes: "",
      });
    } catch (e) {
      console.error("Failed to create resource:", e);
    }
  };

  // Pick single file inside standard modal
  const handlePickSingleFileForForm = async () => {
    try {
      const picked = await resourceService.pickLocalFiles();
      if (!picked || picked.length === 0) return;

      if (picked.length === 1) {
        const file = picked[0];
        setForm((prev) => ({
          ...prev,
          title: prev.title.trim() ? prev.title : cleanFileName(file.file_name),
          url: file.path,
          resource_type: inferResourceType(file.extension),
          notes: prev.notes ? prev.notes : `Local file: ${file.file_name} (${formatBytes(file.file_size_bytes)})`,
        }));
      } else {
        // Multiple files were picked! Transition to batch modal
        const newBatch: BatchImportItem[] = picked.map((f, idx) => ({
          id: `batch-${Date.now()}-${idx}-${Math.random()}`,
          path: f.path,
          title: cleanFileName(f.file_name),
          file_name: f.file_name,
          extension: f.extension,
          file_size_bytes: f.file_size_bytes,
          resource_type: inferResourceType(f.extension),
          author: "",
          learning_status: "in_progress",
          rating: 5,
          notes: `Local file: ${f.file_name} (${formatBytes(f.file_size_bytes)})`,
        }));
        setIsModalOpen(false);
        setBatchItems(newBatch);
        setIsBatchModalOpen(true);
      }
    } catch (e) {
      console.error("Failed to pick file:", e);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await resourceService.updateResourceStatus(id, newStatus);
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, learning_status: newStatus } : r))
      );
    } catch (e) {
      console.error("Failed to update resource status:", e);
    }
  };

  const handleRatingChange = async (id: string, newRating: number) => {
    try {
      await resourceService.updateResourceRating(id, newRating);
      setResources((prev) =>
        prev.map((r) => (r.id === id ? { ...r, rating: newRating } : r))
      );
    } catch (e) {
      console.error("Failed to update rating:", e);
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      await resourceService.deleteResource(id);
      setResources((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error("Failed to delete resource:", e);
    }
  };

  const handleOpenResource = async (url: string) => {
    try {
      await resourceService.openResourceItem(url);
    } catch (e) {
      console.error("Failed to open resource:", e);
    }
  };

  const handleRevealFile = async (path: string) => {
    try {
      await resourceService.revealInExplorer(path);
    } catch (e) {
      console.error("Failed to reveal file:", e);
    }
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Resources & Technical Library
              <Library className="w-5 h-5 text-amber-500" />
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
              Curated Vault
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Store local PDF books, research papers, course slides, official docs, and video lectures in one unified vault.
          </p>
        </div>

        {/* Action Buttons: Multi-File Selection & Manual Add */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/study")}
            variant="outline"
            className="flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:border-amber-500/50"
            title="Open Split-View Reading & Note-Taking Studio"
          >
            <Columns2 className="w-3.5 h-3.5 text-amber-500" />
            <span>Study Studio</span>
          </Button>

          <Button
            onClick={handleSelectMultipleFiles}
            variant="primary"
            className="flex items-center gap-1.5 text-xs shadow-xs cursor-pointer bg-amber-600 hover:bg-amber-700 text-white"
            title="Select and import multiple local PDF, ePUB, notes, or code files"
          >
            <FolderUp className="w-4 h-4" />
            <span>Select Local Files</span>
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            variant="outline"
            className="flex items-center gap-1.5 text-xs shadow-2xs cursor-pointer border-stone-200 dark:border-stone-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link / Single</span>
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Vault</span>
            <Bookmark className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-mono">
              {metrics.total}
            </span>
            <span className="text-xs text-stone-400">tracked</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Reading Now
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">
              {metrics.inProgress}
            </span>
            <span className="text-xs text-stone-400">active</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-stone-400 dark:text-stone-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Reading Queue</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-stone-800 dark:text-stone-200 font-mono">
              {metrics.toRead}
            </span>
            <span className="text-xs text-stone-400">queued</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics.completed}
            </span>
            <span className="text-xs text-stone-400">finished</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
          <div className="flex items-center justify-between text-blue-500 mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Local Files
            </span>
            <HardDrive className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
              {metrics.localFilesCount}
            </span>
            <span className="text-xs text-stone-400">on disk</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search resources by title, author, filename, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
            />
          </div>

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Pipeline Tabs */}
        <div className="flex items-center gap-1 bg-[#F3EFEA] dark:bg-[#191816] p-1 rounded-xl text-xs overflow-x-auto">
          {[
            { label: "All Items", value: "all" },
            { label: "Reading", value: "in_progress" },
            { label: "Queue", value: "to_read" },
            { label: "Finished", value: "completed" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                selectedStatus === tab.value
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-2xs"
                  : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => setSelectedType("all")}
          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition cursor-pointer shrink-0 ${
            selectedType === "all"
              ? "bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
              : "bg-white dark:bg-[#141312] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400"
          }`}
        >
          All Formats ({resources.length})
        </button>

        {Object.entries(TYPE_CONFIG).map(([typeKey, cfg]) => {
          const Icon = cfg.icon;
          const count = resources.filter((r) => r.resource_type === typeKey).length;
          const isSelected = selectedType === typeKey;

          return (
            <button
              key={typeKey}
              onClick={() => setSelectedType(typeKey)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100"
                  : "bg-white dark:bg-[#141312] border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cfg.label}</span>
              <span className="text-[10px] font-mono opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Resources Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-stone-400">Loading learning library...</div>
      ) : filteredResources.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-[#FAF8F5]/60 dark:bg-[#141312]/60 p-8">
          <Library className="w-8 h-8 mx-auto text-stone-400 mb-2" />
          <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
            No Resources Found
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-1 mb-4">
            Import local PDFs, papers, and books directly, or bookmark learning links.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={handleSelectMultipleFiles}
              className="text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              <FolderUp className="w-3.5 h-3.5 mr-1" />
              Select Local Files
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsModalOpen(true)}
              className="text-xs cursor-pointer"
            >
              Add Link / Single
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((res) => {
            const typeMeta = TYPE_CONFIG[res.resource_type] || TYPE_CONFIG.book;
            const TypeIcon = typeMeta.icon;
            const isNotesExpanded = expandedNotes.has(res.id);
            const isLocal = isLocalPath(res.url);

            return (
              <div
                key={res.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Type Badge, Local File Chip, Delete */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-1 ${typeMeta.badgeClass}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        <span>{typeMeta.label}</span>
                      </span>

                      {isLocal && (
                        <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 flex items-center gap-1">
                          <HardDrive className="w-2.5 h-2.5" />
                          <span>Local</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {res.url && (
                        <>
                          {isLocal ? (
                            <>
                              <button
                                onClick={() => handleOpenResource(res.url!)}
                                className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                                title="Open File with System Default App"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRevealFile(res.url!)}
                                className="p-1 rounded text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                                title="Reveal in Windows File Explorer"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleOpenResource(res.url!)}
                              className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                              title="Open Web Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteResource(res.id)}
                        className="p-1 rounded text-stone-400 hover:text-rose-500 transition cursor-pointer"
                        title="Delete Resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <h3
                    onClick={() => res.url && handleOpenResource(res.url)}
                    className={`text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight mb-0.5 ${
                      res.url ? "hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer" : ""
                    }`}
                  >
                    {res.title}
                  </h3>
                  {res.author && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 mb-2">
                      by {res.author}
                    </div>
                  )}

                  {/* Local Path Subtext if available */}
                  {isLocal && res.url && (
                    <div
                      className="text-[10px] text-stone-400 truncate mb-2 font-mono"
                      title={res.url}
                    >
                      {res.url}
                    </div>
                  )}

                  {/* 5-Star Rating Control */}
                  <div className="flex items-center gap-1 mb-3">
                    <span className="text-[10px] text-stone-400 mr-1">Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(res.id, star === res.rating ? 0 : star)}
                        className="p-0.5 text-stone-300 dark:text-stone-700 hover:text-amber-400 transition cursor-pointer"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            star <= res.rating
                              ? "fill-amber-400 text-amber-500"
                              : "text-stone-300 dark:text-stone-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Notes / Takeaways Accordion */}
                  {res.notes && (
                    <div className="mb-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/60 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 mb-1">
                        <span>Notes & Details</span>
                      </div>
                      <p className={`text-stone-600 dark:text-stone-300 ${isNotesExpanded ? "" : "line-clamp-2"}`}>
                        {res.notes}
                      </p>
                      {res.notes.length > 100 && (
                        <button
                          type="button"
                          onClick={() => toggleNotes(res.id)}
                          className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline mt-1 cursor-pointer"
                        >
                          {isNotesExpanded ? "Show Less" : "Read More"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Read & Take Notes in Split-View Studio */}
                  <div className="mb-2.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/study?resourceId=${res.id}`)}
                      className="w-full py-1.5 px-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-amber-500/15 dark:bg-stone-800/80 dark:hover:bg-amber-500/20 text-stone-700 hover:text-amber-700 dark:text-stone-300 dark:hover:text-amber-300 border border-stone-200/70 dark:border-stone-800/70 hover:border-amber-500/40 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Columns2 className="w-3.5 h-3.5 text-amber-500" />
                      <span>Read & Take Notes</span>
                    </button>
                  </div>
                </div>

                {/* Status Switcher Footer */}
                <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/60 dark:border-stone-800/60">
                  <span className="text-[10px] text-stone-400">Status:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res.id, "to_read")}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                        res.learning_status === "to_read"
                          ? "bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                          : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      Queue
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res.id, "in_progress")}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                        res.learning_status === "in_progress"
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold"
                          : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      Reading
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(res.id, "completed")}
                      className={`text-[10px] px-2 py-0.5 rounded-lg font-medium transition cursor-pointer ${
                        res.learning_status === "completed"
                          ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-semibold"
                          : "text-stone-400 hover:text-stone-700"
                      }`}
                    >
                      Finished
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BATCH MULTI-FILE IMPORT MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#141312] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <FolderUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    Batch Import Local Files
                    <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {batchItems.length} selected
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    Review, rename, or customize categories before importing into your technical library.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Global Batch Controls Strip */}
            <div className="p-3 bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-stone-500">Apply to All:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleBatchSetStatus("to_read")}
                    className="text-[10px] px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition cursor-pointer"
                  >
                    Queue All
                  </button>
                  <button
                    onClick={() => handleBatchSetStatus("in_progress")}
                    className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 hover:bg-amber-500/30 transition cursor-pointer font-medium"
                  >
                    Reading All
                  </button>
                </div>

                <div className="h-4 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleBatchSetType("book")}
                    className="text-[10px] px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition cursor-pointer"
                  >
                    All Books
                  </button>
                  <button
                    onClick={() => handleBatchSetType("paper")}
                    className="text-[10px] px-2 py-1 rounded bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 transition cursor-pointer"
                  >
                    All Papers
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddMoreFilesToBatch}
                className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Files</span>
              </button>
            </div>

            {/* Scrollable Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {batchItems.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  All items removed from batch. Click below to add files.
                </div>
              ) : (
                batchItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 hover:border-stone-300 dark:hover:border-stone-700 transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Extension Pill & Title Input */}
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-1 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 shrink-0 mt-0.5">
                          {item.extension || "FILE"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBatchItems((prev) =>
                                prev.map((b) => (b.id === item.id ? { ...b, title: val } : b))
                              );
                            }}
                            placeholder="Resource Title"
                            className="w-full text-xs font-semibold px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#0C0B0A] text-stone-900 dark:text-stone-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                          />
                          <div className="text-[10px] text-stone-400 truncate mt-1 font-mono">
                            {item.path} ({formatBytes(item.file_size_bytes)})
                          </div>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchItem(item.id)}
                        className="p-1 rounded text-stone-400 hover:text-rose-500 transition cursor-pointer shrink-0"
                        title="Remove from batch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Bottom Row: Category, Author, Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                      <div>
                        <select
                          value={item.resource_type}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchItems((prev) =>
                              prev.map((b) => (b.id === item.id ? { ...b, resource_type: val } : b))
                            );
                          }}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                        >
                          <option value="book">Textbook / Book</option>
                          <option value="paper">Research Paper</option>
                          <option value="documentation">Official Docs</option>
                          <option value="course">Course / MOOC</option>
                          <option value="video">Video / Talk</option>
                          <option value="tutorial">Tutorial</option>
                          <option value="article">Blog / Article</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={item.author}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchItems((prev) =>
                              prev.map((b) => (b.id === item.id ? { ...b, author: val } : b))
                            );
                          }}
                          placeholder="Author / Speaker (optional)"
                          className="w-full px-2 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <select
                          value={item.learning_status}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBatchItems((prev) =>
                              prev.map((b) => (b.id === item.id ? { ...b, learning_status: val } : b))
                            );
                          }}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                        >
                          <option value="to_read">Queue (To Read)</option>
                          <option value="in_progress">Reading (Active)</option>
                          <option value="completed">Finished</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Total: <strong>{batchItems.length}</strong> resources ready to import
              </span>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveBatch}
                  disabled={batchItems.length === 0 || isBatchSaving}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isBatchSaving
                    ? "Importing..."
                    : `Import All ${batchItems.length} Resources`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE RESOURCE / MANUAL URL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#141312] border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200 dark:border-stone-800">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-500" />
                Add Learning Resource
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Multi-File Quick Action Banner inside Modal */}
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                <FolderUp className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Want to add multiple files at once?</span>
              </div>
              <button
                type="button"
                onClick={handleSelectMultipleFiles}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition cursor-pointer shrink-0"
              >
                Select Files
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems: Three Easy Pieces (OSTEP)"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Resource Type
                  </label>
                  <select
                    value={form.resource_type}
                    onChange={(e) => setForm((prev) => ({ ...prev, resource_type: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="book">Textbook / Book</option>
                    <option value="paper">Research Paper</option>
                    <option value="documentation">Official Docs</option>
                    <option value="course">Course / MOOC</option>
                    <option value="video">Video / Talk</option>
                    <option value="article">Engineering Blog</option>
                    <option value="tutorial">Tutorial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Author / Creator
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Martin Kleppmann"
                    value={form.author || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                    File Path or Web URL
                  </label>
                  <button
                    type="button"
                    onClick={handlePickSingleFileForForm}
                    className="text-[11px] font-medium text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse Local File</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="https://... or C:\path\to\document.pdf"
                  value={form.url || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={form.learning_status}
                    onChange={(e) => setForm((prev) => ({ ...prev, learning_status: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="in_progress">Reading / In Progress</option>
                    <option value="to_read">To Read / Queue</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Initial Rating
                  </label>
                  <select
                    value={form.rating || 5}
                    onChange={(e) => setForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Key Takeaways & Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Summary notes, important chapters, or practical applications..."
                  value={form.notes || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="text-xs shadow-xs cursor-pointer"
                >
                  Save Resource
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
