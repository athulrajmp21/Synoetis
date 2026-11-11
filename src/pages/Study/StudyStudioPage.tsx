import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Columns2,
  BookOpen,
  FileText,
  ExternalLink,
  FolderOpen,
  Save,
  Check,
  Sparkles,
  Search,
  Quote,
  Clock,
  Bold,
  Italic,
  Code2,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Bookmark,
  ChevronDown,
  Layers,
  Maximize2,
  Minimize2,
  Download,
  Copy,
  FolderUp,
  RefreshCw,
  HardDrive,
  Globe,
  Star,
  Eye,
  Edit3,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { resourceService, notesService } from "@/services/api";
import {
  ResourceItem,
  ResourceContentResponse,
  NoteSummary,
  NoteDetail,
} from "@/types/models";

type SplitPreset = "50-50" | "60-40" | "40-60" | "reader-only" | "notes-only";
type NoteMode = "resource" | "knowledge";
type EditorView = "edit" | "preview" | "split";

export const StudyStudioPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlResourceId = searchParams.get("resourceId");
  const urlNoteId = searchParams.get("noteId");

  // Resource state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
    urlResourceId
  );
  const [resourceContent, setResourceContent] =
    useState<ResourceContentResponse | null>(null);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);

  // Knowledge Hub notes state
  const [knowledgeNotes, setKnowledgeNotes] = useState<NoteSummary[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(urlNoteId);

  // Note Mode & Text Editor State
  const [noteMode, setNoteMode] = useState<NoteMode>("resource");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editorView, setEditorView] = useState<EditorView>("split");
  const [splitPreset, setSplitPreset] = useState<SplitPreset>("50-50");

  // Save feedback
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">(
    "saved"
  );
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Text reader search & filter
  const [textSearchQuery, setTextSearchQuery] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selected resource object
  const currentResource = useMemo(
    () => resources.find((r) => r.id === selectedResourceId) || null,
    [resources, selectedResourceId]
  );

  // Load all initial resources and knowledge notes
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [resList, noteList] = await Promise.all([
        resourceService.getResources(),
        notesService.getNotes(),
      ]);
      setResources(resList);
      setKnowledgeNotes(noteList);

      // Determine initial resource
      if (urlResourceId) {
        setSelectedResourceId(urlResourceId);
      } else if (resList.length > 0) {
        // Prefer first in_progress or first available
        const activeRes =
          resList.find((r) => r.learning_status === "in_progress") || resList[0];
        setSelectedResourceId(activeRes.id);
        setSearchParams({ resourceId: activeRes.id });
      }

      // Determine initial note if provided
      if (urlNoteId) {
        setSelectedNoteId(urlNoteId);
        setNoteMode("knowledge");
      }
    } catch (e) {
      console.error("Failed to load initial data in Study Studio:", e);
    }
  };

  // When selectedResourceId changes, load the resource and note content
  useEffect(() => {
    if (selectedResourceId) {
      loadResourceContent(selectedResourceId);
      if (noteMode === "resource") {
        const res = resources.find((r) => r.id === selectedResourceId);
        if (res) {
          setNoteTitle(res.title);
          setNoteContent(res.notes || "");
          setSaveStatus("saved");
        }
      }
    }
  }, [selectedResourceId, resources]);

  // When selectedNoteId changes in knowledge mode, load note detail
  useEffect(() => {
    if (noteMode === "knowledge" && selectedNoteId) {
      loadKnowledgeNote(selectedNoteId);
    }
  }, [selectedNoteId, noteMode]);

  const loadResourceContent = async (resourceId: string) => {
    const res = resources.find((r) => r.id === resourceId);
    if (!res) return;

    if (!res.url) {
      setResourceContent(null);
      setResourceError(null);
      return;
    }

    const isLocal =
      /^[a-zA-Z]:[\\/]/.test(res.url) ||
      res.url.startsWith("/") ||
      res.url.includes("\\");

    if (!isLocal) {
      // It's a web URL
      setResourceContent(null);
      setResourceError(null);
      return;
    }

    setResourceLoading(true);
    setResourceError(null);
    try {
      const content = await resourceService.loadResourceContent(res.url);
      setResourceContent(content);
    } catch (err: any) {
      console.warn("Could not load local file content:", err);
      setResourceContent(null);
      setResourceError(
        typeof err === "string" ? err : err?.message || "Unable to read local file."
      );
    } finally {
      setResourceLoading(false);
    }
  };

  const loadKnowledgeNote = async (noteId: string) => {
    try {
      const note = await notesService.getNoteById(noteId);
      if (note) {
        setNoteTitle(note.title);
        // If content is stored as JSON array of blocks, format it to markdown
        try {
          const parsed = JSON.parse(note.content_markdown);
          if (Array.isArray(parsed)) {
            const md = parsed
              .map((b: any) => {
                if (b.type === "h1") return `# ${b.content}\n`;
                if (b.type === "h2") return `## ${b.content}\n`;
                if (b.type === "h3") return `### ${b.content}\n`;
                if (b.type === "bullet") return `- ${b.content}`;
                if (b.type === "todo") return `- [${b.checked ? "x" : " "}] ${b.content}`;
                if (b.type === "code") return `\`\`\`${b.language || ""}\n${b.content}\n\`\`\``;
                if (b.type === "quote") return `> ${b.content}`;
                if (b.type === "callout") return `> [!NOTE]\n> ${b.content}`;
                if (b.type === "divider") return `---`;
                return b.content || "";
              })
              .join("\n\n");
            setNoteContent(md);
          } else {
            setNoteContent(note.content_markdown || "");
          }
        } catch {
          setNoteContent(note.content_markdown || "");
        }
        setSaveStatus("saved");
      }
    } catch (e) {
      console.error("Failed to load knowledge note:", e);
    }
  };

  // Debounced Auto-Save
  const handleContentChange = (newContent: string) => {
    setNoteContent(newContent);
    setSaveStatus("saving");

    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }

    saveDebounceTimer.current = setTimeout(async () => {
      await performSave(noteTitle, newContent);
    }, 600);
  };

  const handleTitleChange = (newTitle: string) => {
    setNoteTitle(newTitle);
    setSaveStatus("saving");

    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }

    saveDebounceTimer.current = setTimeout(async () => {
      await performSave(newTitle, noteContent);
    }, 600);
  };

  const performSave = async (title: string, content: string) => {
    try {
      if (noteMode === "resource" && selectedResourceId) {
        await resourceService.updateResource(selectedResourceId, {
          notes: content,
        });
        // Update local state cache
        setResources((prev) =>
          prev.map((r) =>
            r.id === selectedResourceId ? { ...r, notes: content } : r
          )
        );
      } else if (noteMode === "knowledge") {
        const saved = await notesService.saveNote(
          selectedNoteId,
          title || "Untitled Study Note",
          content
        );
        if (!selectedNoteId) {
          setSelectedNoteId(saved.id);
          setSearchParams({
            resourceId: selectedResourceId || "",
            noteId: saved.id,
          });
        }
        const updatedList = await notesService.getNotes();
        setKnowledgeNotes(updatedList);
      }

      setSaveStatus("saved");
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } catch (e) {
      console.error("Failed to save note:", e);
      setSaveStatus("idle");
    }
  };

  // Switch Note Modes
  const handleSwitchMode = async (mode: NoteMode) => {
    setNoteMode(mode);
    if (mode === "resource") {
      if (currentResource) {
        setNoteTitle(currentResource.title);
        setNoteContent(currentResource.notes || "");
      }
    } else {
      // In knowledge mode: if already have selectedNoteId, load it; else prompt or create
      if (selectedNoteId) {
        loadKnowledgeNote(selectedNoteId);
      } else {
        // Create new linked study note
        const title = currentResource
          ? `[Study] ${currentResource.title}`
          : "New Study Note";
        const initial = currentResource
          ? `# ${currentResource.title}\n\n**Author**: ${currentResource.author || "Unknown"}\n**Format**: ${currentResource.resource_type.toUpperCase()}\n\n---\n\n### 📌 Executive Takeaways & Chapter Notes\n\n${currentResource.notes || ""}`
          : "# Untitled Study Note\n\nStart capturing insights...";
        const newNote = await notesService.saveNote(null, title, initial);
        setSelectedNoteId(newNote.id);
        setNoteTitle(newNote.title);
        setNoteContent(newNote.content_markdown);
        const updated = await notesService.getNotes();
        setKnowledgeNotes(updated);
      }
    }
  };

  // Formatting Toolbar Actions
  const insertTextAtCursor = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);

    const replacement = prefix + selected + suffix;
    const updated =
      current.substring(0, start) + replacement + current.substring(end);

    handleContentChange(updated);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 0);
  };

  // Quote selected text or resource title to the notes editor
  const handleInsertCitation = () => {
    if (!currentResource) return;
    const citation = `\n> 📌 **${currentResource.title}**${
      currentResource.author ? ` — by ${currentResource.author}` : ""
    }\n> \n`;
    insertTextAtCursor(citation);
  };

  const handleInsertTimestamp = () => {
    const now = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    insertTextAtCursor(`_${now}_ `);
  };

  // Copy quote from text reader to notes editor
  const handleQuoteTextReader = (snippet: string) => {
    const formatted = `\n> 💬 "${snippet.trim()}"\n> — *${
      currentResource?.title || "Resource"
    }*\n\n`;
    insertTextAtCursor(formatted);
  };

  // Export & Action utilities
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(noteContent);
    setCopyFeedback("Copied markdown to clipboard!");
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([noteContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${noteTitle.replace(/[^a-zA-Z0-9_-]/g, "_") || "notes"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenExternal = async () => {
    if (currentResource?.url) {
      await resourceService.openResourceItem(currentResource.url);
    }
  };

  const handleRevealExplorer = async () => {
    if (currentResource?.url) {
      await resourceService.revealInExplorer(currentResource.url);
    }
  };

  const handleSelectResourceFromDropdown = (resId: string) => {
    setSelectedResourceId(resId);
    setSearchParams({ resourceId: resId });
  };

  const handleBrowseLocalFiles = async () => {
    const files = await resourceService.pickLocalFiles();
    if (files.length > 0) {
      const created = await resourceService.createResourcesBatch(
        files.map((f) => ({
          title: f.file_name.replace(/\.[^/.]+$/, ""),
          resource_type: f.extension === "pdf" ? "book" : "documentation",
          url: f.path,
          learning_status: "in_progress",
        }))
      );
      if (created.length > 0) {
        const all = await resourceService.getResources();
        setResources(all);
        setSelectedResourceId(created[0].id);
        setSearchParams({ resourceId: created[0].id });
      }
    }
  };

  // Convert note content to basic HTML for the Preview pane
  const renderedHtml = useMemo(() => {
    if (!noteContent)
      return '<p class="text-stone-400 italic">No notes entered yet. Type on the left or use formatting tools above.</p>';

    const lines = noteContent.split("\n");
    let inCodeBlock = false;
    let codeBlockLang = "";
    let codeBlockLines: string[] = [];
    const htmlParts: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks
      if (line.startsWith("```")) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockLang = line.replace("```", "").trim();
          codeBlockLines = [];
        } else {
          inCodeBlock = false;
          htmlParts.push(
            `<pre class="my-3 p-3.5 rounded-xl bg-stone-900 text-stone-100 font-mono text-xs overflow-x-auto border border-stone-800"><code>${codeBlockLines
              .map((l) =>
                l
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
              )
              .join("\n")}</code></pre>`
          );
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        continue;
      }

      // Headings
      if (line.startsWith("### ")) {
        htmlParts.push(
          `<h3 class="text-sm font-bold text-stone-900 dark:text-stone-100 mt-4 mb-1.5 flex items-center gap-1.5">${formatInline(
            line.substring(4)
          )}</h3>`
        );
        continue;
      }
      if (line.startsWith("## ")) {
        htmlParts.push(
          `<h2 class="text-base font-bold text-stone-900 dark:text-stone-100 mt-5 mb-2 pb-1 border-b border-stone-200 dark:border-stone-800">${formatInline(
            line.substring(3)
          )}</h2>`
        );
        continue;
      }
      if (line.startsWith("# ")) {
        htmlParts.push(
          `<h1 class="text-lg font-extrabold text-stone-900 dark:text-stone-100 mt-6 mb-2.5 tracking-tight">${formatInline(
            line.substring(2)
          )}</h1>`
        );
        continue;
      }

      // Blockquotes
      if (line.startsWith("> ")) {
        const callout = line.substring(2);
        htmlParts.push(
          `<blockquote class="my-2.5 pl-3.5 py-1 border-l-3 border-amber-500 bg-amber-500/10 dark:bg-amber-500/5 rounded-r-lg text-xs text-stone-700 dark:text-stone-300 italic">${formatInline(
            callout
          )}</blockquote>`
        );
        continue;
      }

      // Dividers
      if (line.trim() === "---" || line.trim() === "***") {
        htmlParts.push(
          `<hr class="my-4 border-t border-stone-200 dark:border-stone-800" />`
        );
        continue;
      }

      // Checkbox items
      if (line.startsWith("- [x] ") || line.startsWith("- [X] ")) {
        htmlParts.push(
          `<div class="flex items-center gap-2 text-xs text-stone-400 line-through my-1"><span class="w-3.5 h-3.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[10px]">✓</span><span>${formatInline(
            line.substring(6)
          )}</span></div>`
        );
        continue;
      }
      if (line.startsWith("- [ ] ")) {
        htmlParts.push(
          `<div class="flex items-center gap-2 text-xs text-stone-700 dark:text-stone-300 my-1"><span class="w-3.5 h-3.5 rounded border border-stone-300 dark:border-stone-600 inline-block"></span><span>${formatInline(
            line.substring(6)
          )}</span></div>`
        );
        continue;
      }

      // Bullet lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        htmlParts.push(
          `<li class="text-xs text-stone-700 dark:text-stone-300 ml-4 list-disc my-0.5">${formatInline(
            line.substring(2)
          )}</li>`
        );
        continue;
      }

      // Regular paragraph
      if (line.trim().length > 0) {
        htmlParts.push(
          `<p class="text-xs text-stone-700 dark:text-stone-300 my-1.5 leading-relaxed">${formatInline(
            line
          )}</p>`
        );
      }
    }

    return htmlParts.join("");
  }, [noteContent]);

  function formatInline(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900 dark:text-stone-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 font-mono text-[11px] text-amber-700 dark:text-amber-300">$1</code>');
  }

  // Split-layout class mapping
  const leftColClass = useMemo(() => {
    switch (splitPreset) {
      case "50-50":
        return "w-1/2";
      case "60-40":
        return "w-3/5";
      case "40-60":
        return "w-2/5";
      case "reader-only":
        return "w-full";
      case "notes-only":
        return "hidden";
      default:
        return "w-1/2";
    }
  }, [splitPreset]);

  const rightColClass = useMemo(() => {
    switch (splitPreset) {
      case "50-50":
        return "w-1/2";
      case "60-40":
        return "w-2/5";
      case "40-60":
        return "w-3/5";
      case "reader-only":
        return "hidden";
      case "notes-only":
        return "w-full";
      default:
        return "w-1/2";
    }
  }, [splitPreset]);

  const wordCount = useMemo(() => {
    return noteContent.trim() ? noteContent.trim().split(/\s+/).length : 0;
  }, [noteContent]);

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] -m-5 bg-[#FAF8F5] dark:bg-[#0C0B0A] overflow-hidden select-text">
      {/* Top Header Control Strip */}
      <div className="h-12 border-b border-stone-200/80 dark:border-stone-800/80 bg-white/80 dark:bg-[#141312]/80 backdrop-blur-md px-4 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Studio Identity & Resource Selector */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 text-stone-900 dark:text-stone-100 font-bold text-xs shrink-0">
            <Columns2 className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Study Studio</span>
          </div>

          <div className="h-4 w-px bg-stone-200 dark:bg-stone-800" />

          {/* Resource Picker Dropdown */}
          <div className="relative flex items-center gap-1.5 min-w-0">
            <select
              value={selectedResourceId || ""}
              onChange={(e) => handleSelectResourceFromDropdown(e.target.value)}
              className="text-xs font-medium bg-stone-100 dark:bg-stone-800/90 text-stone-800 dark:text-stone-200 rounded-lg px-2.5 py-1 pr-7 border-0 outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer max-w-[220px] sm:max-w-[320px] truncate"
            >
              {resources.length === 0 ? (
                <option value="">No library resources found</option>
              ) : (
                resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    [{r.resource_type.toUpperCase()}] {r.title}
                  </option>
                ))
              )}
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={handleBrowseLocalFiles}
              className="h-7 px-2 text-[11px] border-stone-200 dark:border-stone-800 hover:border-amber-500/50 cursor-pointer shrink-0"
              title="Open any local PDF or document from your computer"
            >
              <FolderUp className="w-3.5 h-3.5 mr-1 text-stone-500" />
              <span className="hidden md:inline">Open File</span>
            </Button>
          </div>
        </div>

        {/* Center: Split Ratio Selector */}
        <div className="hidden lg:flex items-center bg-stone-100 dark:bg-stone-800/80 rounded-lg p-0.5 text-[11px] font-medium text-stone-600 dark:text-stone-400">
          <button
            onClick={() => setSplitPreset("50-50")}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
              splitPreset === "50-50"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                : "hover:text-stone-900 dark:hover:text-stone-200"
            }`}
            title="Split 50% Reader / 50% Notes"
          >
            50 / 50
          </button>
          <button
            onClick={() => setSplitPreset("60-40")}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
              splitPreset === "60-40"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                : "hover:text-stone-900 dark:hover:text-stone-200"
            }`}
            title="60% Reader / 40% Notes"
          >
            60 / 40
          </button>
          <button
            onClick={() => setSplitPreset("40-60")}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
              splitPreset === "40-60"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                : "hover:text-stone-900 dark:hover:text-stone-200"
            }`}
            title="40% Reader / 60% Notes"
          >
            40 / 60
          </button>
          <button
            onClick={() => setSplitPreset("reader-only")}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
              splitPreset === "reader-only"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                : "hover:text-stone-900 dark:hover:text-stone-200"
            }`}
            title="Focus Mode: Full Reader"
          >
            Reader
          </button>
          <button
            onClick={() => setSplitPreset("notes-only")}
            className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
              splitPreset === "notes-only"
                ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                : "hover:text-stone-900 dark:hover:text-stone-200"
            }`}
            title="Focus Mode: Full Notes"
          >
            Notes
          </button>
        </div>

        {/* Right: Note Target Mode & Save Status */}
        <div className="flex items-center gap-2.5">
          {/* Note target toggle */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800/80 rounded-lg p-0.5 text-[11px] font-medium">
            <button
              onClick={() => handleSwitchMode("resource")}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                noteMode === "resource"
                  ? "bg-white dark:bg-stone-700 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold"
                  : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
              title="Store notes directly on this library resource"
            >
              Takeaways
            </button>
            <button
              onClick={() => handleSwitchMode("knowledge")}
              className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                noteMode === "knowledge"
                  ? "bg-white dark:bg-stone-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold"
                  : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200"
              }`}
              title="Store notes as a Knowledge Hub document"
            >
              Knowledge Doc
            </button>
          </div>

          {/* Live SQLite status pill */}
          <div className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-500">
            {saveStatus === "saving" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-amber-600 dark:text-amber-400">Saving...</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================== */}
        {/* LEFT PANE: EMBEDDED RESOURCE READER                             */}
        {/* ============================================================== */}
        <div
          className={`${leftColClass} border-r border-stone-200/80 dark:border-stone-800/80 bg-white dark:bg-[#11100F] flex flex-col overflow-hidden transition-all duration-150`}
        >
          {/* Reader Sub-Toolbar */}
          <div className="h-9 border-b border-stone-200/60 dark:border-stone-800/60 px-3.5 flex items-center justify-between text-xs text-stone-500 shrink-0 bg-stone-50/50 dark:bg-stone-900/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-stone-700 dark:text-stone-300 truncate text-[11px]">
                {currentResource ? currentResource.title : "No Resource Selected"}
              </span>
              {resourceContent && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                  {resourceContent.extension.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {currentResource?.url && (
                <>
                  <button
                    onClick={handleOpenExternal}
                    className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                    title="Open in System Default Application"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleRevealExplorer}
                    className="p-1 rounded text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                    title="Reveal in Windows File Explorer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Reader Viewport */}
          <div className="flex-1 relative overflow-auto bg-stone-100/50 dark:bg-[#0E0D0C]">
            {resourceLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-xs text-stone-400 gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>Reading local file into memory...</span>
              </div>
            ) : !currentResource ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <BookOpen className="w-10 h-10 text-stone-300 dark:text-stone-700 mb-3" />
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  No Resource Loaded
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mt-1 mb-4">
                  Select a textbook, research paper, or technical guide from the top dropdown, or open any local file.
                </p>
                <Button
                  size="sm"
                  onClick={handleBrowseLocalFiles}
                  className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  <FolderUp className="w-3.5 h-3.5 mr-1" />
                  Select Local File
                </Button>
              </div>
            ) : resourceError ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="p-3 rounded-full bg-rose-500/10 text-rose-500 mb-3">
                  <HardDrive className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  Could Not Load Local File
                </h3>
                <p className="text-xs text-stone-500 max-w-sm mt-1 mb-3">
                  {resourceError}
                </p>
                {currentResource.url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleOpenExternal}
                    className="text-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Open with System Reader
                  </Button>
                )}
              </div>
            ) : resourceContent?.is_pdf && resourceContent.data_url ? (
              /* PDF Native Viewer in WebView2 */
              <div className="w-full h-full">
                <iframe
                  src={resourceContent.data_url}
                  title={resourceContent.file_name}
                  className="w-full h-full border-0 bg-stone-900"
                />
              </div>
            ) : resourceContent?.is_text && resourceContent.text_content !== null ? (
              /* Text / Markdown / Code Viewer with Search & Quotes */
              <div className="flex flex-col h-full bg-[#18181B] text-stone-200 font-mono text-xs">
                {/* Search Bar in Text Reader */}
                <div className="p-2 border-b border-stone-800 flex items-center justify-between gap-2 bg-[#202024]">
                  <div className="flex items-center gap-1.5 flex-1 bg-stone-900 rounded px-2 py-1 border border-stone-800">
                    <Search className="w-3 h-3 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Filter / Search document lines..."
                      value={textSearchQuery}
                      onChange={(e) => setTextSearchQuery(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs text-stone-200 w-full placeholder-stone-500 font-sans"
                    />
                    {textSearchQuery && (
                      <button
                        onClick={() => setTextSearchQuery("")}
                        className="text-stone-400 hover:text-stone-200 text-[10px]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (resourceContent?.text_content) {
                        navigator.clipboard.writeText(resourceContent.text_content);
                        setCopyFeedback("Copied document text!");
                        setTimeout(() => setCopyFeedback(null), 2000);
                      }
                    }}
                    className="h-6 px-2 text-[10px] text-stone-400 hover:text-stone-100"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy All
                  </Button>
                </div>

                {/* Text Content Lines */}
                <div className="flex-1 overflow-auto p-4 leading-relaxed select-text">
                  {(resourceContent.text_content || "")
                    .split("\n")
                    .filter((l) =>
                      textSearchQuery
                        ? l.toLowerCase().includes(textSearchQuery.toLowerCase())
                        : true
                    )
                    .map((line, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start hover:bg-stone-800/60 rounded px-1.5 py-0.5 transition"
                      >
                        <span className="w-10 text-right pr-3 text-stone-600 select-none text-[10px]">
                          {idx + 1}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap break-all">
                          {line || "\u00A0"}
                        </span>
                        {line.trim().length > 0 && (
                          <button
                            onClick={() => handleQuoteTextReader(line)}
                            className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-400 hover:text-amber-300 font-sans ml-2 px-1 rounded bg-stone-800 border border-stone-700 transition cursor-pointer select-none"
                            title="Insert this line as a blockquote into your notes pad"
                          >
                            Quote
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ) : resourceContent?.is_image && resourceContent.data_url ? (
              /* Image Viewer */
              <div className="w-full h-full flex items-center justify-center p-4 bg-stone-950">
                <img
                  src={resourceContent.data_url}
                  alt={resourceContent.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              </div>
            ) : currentResource.url ? (
              /* Web URL fallback */
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Globe className="w-12 h-12 text-blue-500 mb-3" />
                <h3 className="text-base font-bold text-stone-800 dark:text-stone-200">
                  Web Resource Link
                </h3>
                <p className="text-xs text-stone-500 max-w-md mt-1 mb-4 truncate font-mono">
                  {currentResource.url}
                </p>
                <Button
                  onClick={handleOpenExternal}
                  className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer text-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Open in Browser
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-xs text-stone-400">
                <span>No file path or URL configured for this resource.</span>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT PANE: LIVE ANNOTATIONS & STUDY PAD                        */}
        {/* ============================================================== */}
        <div
          className={`${rightColClass} bg-white dark:bg-[#141312] flex flex-col overflow-hidden transition-all duration-150`}
        >
          {/* Note Metadata & Toolbar */}
          <div className="border-b border-stone-200/80 dark:border-stone-800/80 px-4 py-2 shrink-0 bg-[#FAF8F5]/80 dark:bg-[#121110]/80">
            {/* Title Row */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <input
                type="text"
                value={noteTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Study Note Title..."
                className="text-sm font-bold text-stone-900 dark:text-stone-100 bg-transparent border-0 outline-none w-full placeholder-stone-400 focus:ring-0"
              />

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-stone-400 font-mono">
                  {wordCount} words
                </span>

                <div className="h-3 w-px bg-stone-200 dark:bg-stone-800 mx-1" />

                {/* View toggle (Edit / Preview / Split) */}
                <div className="flex items-center bg-stone-200/60 dark:bg-stone-800 rounded-md p-0.5 text-[10px] font-medium text-stone-600 dark:text-stone-400">
                  <button
                    onClick={() => setEditorView("edit")}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      editorView === "edit"
                        ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                        : "hover:text-stone-900"
                    }`}
                    title="Editor Only"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setEditorView("split")}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      editorView === "split"
                        ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                        : "hover:text-stone-900"
                    }`}
                    title="Split Editor & Preview"
                  >
                    Split
                  </button>
                  <button
                    onClick={() => setEditorView("preview")}
                    className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                      editorView === "preview"
                        ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                        : "hover:text-stone-900"
                    }`}
                    title="Formatted Preview"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Markdown Action Buttons */}
            <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 text-xs pt-1 border-t border-stone-200/50 dark:border-stone-800/50">
              <div className="flex items-center gap-0.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("# ")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Heading 1"
                >
                  <Heading1 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("## ")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Heading 2"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("### ")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Heading 3"
                >
                  <Heading3 className="w-3.5 h-3.5" />
                </button>
                <div className="h-3 w-px bg-stone-300 dark:bg-stone-700 mx-1" />
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("**", "**")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Bold (**text**)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("*", "*")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Italic (*text*)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("`", "`")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Inline Code (`code`)"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
                <div className="h-3 w-px bg-stone-300 dark:bg-stone-700 mx-1" />
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("- ")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Bullet List (- item)"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("- [ ] ")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Task Checkbox (- [ ] task)"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("> ")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Blockquote (> quote)"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => insertTextAtCursor("```\n", "\n```")}
                  className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer"
                  title="Code Block (```)"
                >
                  <span className="text-[10px] font-mono font-bold">{"{}"}</span>
                </button>

                <div className="h-3 w-px bg-stone-300 dark:bg-stone-700 mx-1" />

                {/* Insert Citation button */}
                <button
                  type="button"
                  onClick={handleInsertCitation}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition cursor-pointer flex items-center gap-1"
                  title="Insert citation tag for current textbook"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Cite Resource</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertTimestamp}
                  className="px-1.5 py-0.5 rounded text-[10px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/70 dark:hover:bg-stone-800 transition cursor-pointer flex items-center gap-1"
                  title="Insert current date & time"
                >
                  <Clock className="w-3 h-3" />
                  <span>Timestamp</span>
                </button>
              </div>

              {/* Utility Export Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyMarkdown}
                  className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                  title="Copy Raw Markdown"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                  title="Download .md File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Copy Toast Notification */}
          {copyFeedback && (
            <div className="bg-emerald-500 text-white text-[11px] font-medium py-1 px-3 text-center shadow-xs animate-in fade-in">
              {copyFeedback}
            </div>
          )}

          {/* Note Editor Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Raw Textarea Editor */}
            {(editorView === "edit" || editorView === "split") && (
              <div
                className={`${
                  editorView === "split" ? "w-1/2 border-r border-stone-200 dark:border-stone-800" : "w-full"
                } h-full p-4 overflow-auto flex flex-col`}
              >
                <textarea
                  ref={textareaRef}
                  value={noteContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`Write your chapter takeaways, summaries, and code snippets here...\n\nTips:\n- Type # for H1, ## for H2\n- Use > for quotes\n- Click 'Cite Resource' to reference ${currentResource?.title || "your book"}`}
                  className="w-full flex-1 bg-transparent border-0 outline-none resize-none font-mono text-xs text-stone-800 dark:text-stone-200 leading-relaxed placeholder-stone-400 selection:bg-amber-500/20"
                />
              </div>
            )}

            {/* Formatted Markdown Preview */}
            {(editorView === "preview" || editorView === "split") && (
              <div
                className={`${
                  editorView === "split" ? "w-1/2" : "w-full"
                } h-full p-5 overflow-auto bg-[#FAF8F5]/40 dark:bg-[#121110]/40`}
              >
                <div
                  className="prose dark:prose-invert max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
