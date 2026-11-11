import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  Search,
  Sparkles,
  Code2,
  ListTodo,
  Copy,
  ChevronRight,
  Columns2,
  Download,
  Upload,
  Brain,
  FolderArchive,
} from "lucide-react";
import { NotionBlock, EditorBlock, BlockType } from "@/components/knowledge/NotionBlock";
import { SlashMenu } from "@/components/knowledge/SlashMenu";
import { Button } from "@/components/ui/Button";
import { notesService, srsService } from "@/services/api";
import { NoteSummary } from "@/types/models";
import { SrsReviewModal } from "@/components/srs/SrsReviewModal";

export const KnowledgePage: React.FC = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState("Untitled Note");
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saveStatus, setSaveStatus] = useState<string>("Saved");
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isSrsOpen, setIsSrsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slash menu state
  const [slashMenuState, setSlashMenuState] = useState<{
    isOpen: boolean;
    blockId: string;
    position: { top: number; left: number };
  }>({
    isOpen: false,
    blockId: "",
    position: { top: 0, left: 0 },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load notes list on mount
  useEffect(() => {
    loadNotesList();
  }, []);

  const loadNotesList = async () => {
    try {
      const list = await notesService.getNotes();
      setNotes(list);
      if (list.length > 0 && !activeNoteId) {
        loadNoteDetail(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load notes:", e);
    }
  };

  const loadNoteDetail = async (id: string) => {
    try {
      setActiveNoteId(id);
      const detail = await notesService.getNoteById(id);
      if (detail) {
        setNoteTitle(detail.title || "Untitled Note");
        try {
          const parsed = JSON.parse(detail.content_markdown);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBlocks(parsed);
          } else {
            setBlocks([
              {
                id: crypto.randomUUID(),
                type: "paragraph",
                content: detail.content_markdown || "",
              },
            ]);
          }
        } catch {
          setBlocks([
            {
              id: crypto.randomUUID(),
              type: "paragraph",
              content: detail.content_markdown || "",
            },
          ]);
        }
      }
    } catch (e) {
      console.error("Failed to load note detail:", e);
    }
  };

  // Auto-save triggers
  const triggerAutoSave = (updatedTitle: string, updatedBlocks: EditorBlock[]) => {
    setSaveStatus("Saving...");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const jsonContent = JSON.stringify(updatedBlocks);
        const saved = await notesService.saveNote(activeNoteId, updatedTitle, jsonContent);
        if (!activeNoteId) {
          setActiveNoteId(saved.id);
        }
        setSaveStatus("Saved");
        const list = await notesService.getNotes();
        setNotes(list);
      } catch (e) {
        console.error("Save error:", e);
        setSaveStatus("Error saving");
      }
    }, 600);
  };

  const handleCreateNewNote = async () => {
    const initialBlocks: EditorBlock[] = [
      { id: crypto.randomUUID(), type: "h1", content: "New Document" },
      {
        id: crypto.randomUUID(),
        type: "paragraph",
        content: "Start typing here or type / for slash commands...",
      },
    ];
    const newNote = await notesService.saveNote(
      null,
      "New Document",
      JSON.stringify(initialBlocks)
    );
    await loadNotesList();
    setActiveNoteId(newNote.id);
    setNoteTitle(newNote.title);
    setBlocks(initialBlocks);
  };

  const handleDeleteCurrentNote = async () => {
    if (!activeNoteId) return;
    await notesService.deleteNote(activeNoteId);
    setActiveNoteId(null);
    setBlocks([]);
    setNoteTitle("");
    const list = await notesService.getNotes();
    setNotes(list);
    if (list.length > 0) {
      loadNoteDetail(list[0].id);
    }
  };

  // Block manipulations
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === active.id);
      const newIndex = prev.findIndex((b) => b.id === over.id);
      const updated = arrayMove(prev, oldIndex, newIndex);
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
  };

  const handleBlockChangeContent = (id: string, content: string) => {
    setBlocks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, content } : b));
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
  };

  const handleToggleTodo = (id: string) => {
    setBlocks((prev) => {
      const updated = prev.map((b) =>
        b.id === id ? { ...b, checked: !b.checked } : b
      );
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    setBlocks((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
  };

  const handleMoveUp = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx <= 0) return;
    setBlocks((prev) => {
      const updated = arrayMove(prev, idx, idx - 1);
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
  };

  const handleMoveDown = (id: string) => {
    const idx = blocks.findIndex((b) => b.id === id);
    if (idx === -1 || idx >= blocks.length - 1) return;
    setBlocks((prev) => {
      const updated = arrayMove(prev, idx, idx + 1);
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
  };

  const handleAddBlock = (type: BlockType = "paragraph") => {
    const newBlock: EditorBlock = {
      id: crypto.randomUUID(),
      type,
      content: "",
      checked: type === "todo" ? false : undefined,
    };
    setBlocks((prev) => {
      const updated = [...prev, newBlock];
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
  };

  const handleSelectSlashType = (newType: BlockType) => {
    if (!slashMenuState.blockId) return;
    setBlocks((prev) => {
      const updated = prev.map((b) => {
        if (b.id === slashMenuState.blockId) {
          const cleanContent = b.content.replace(/^\/.*$/, "").trim();
          return {
            ...b,
            type: newType,
            content: cleanContent,
            checked: newType === "todo" ? false : undefined,
          };
        }
        return b;
      });
      triggerAutoSave(noteTitle, updated);
      return updated;
    });
    setSlashMenuState({ isOpen: false, blockId: "", position: { top: 0, left: 0 } });
  };

  const handleExportMarkdown = () => {
    let md = `# ${noteTitle}\n\n`;
    blocks.forEach((b) => {
      switch (b.type) {
        case "h1":
          md += `# ${b.content}\n\n`;
          break;
        case "h2":
          md += `## ${b.content}\n\n`;
          break;
        case "h3":
          md += `### ${b.content}\n\n`;
          break;
        case "bullet":
          md += `- ${b.content}\n`;
          break;
        case "todo":
          md += `- [${b.checked ? "x" : " "}] ${b.content}\n`;
          break;
        case "code":
          md += "```" + (b.language || "text") + "\n" + b.content + "\n```\n\n";
          break;
        case "quote":
          md += `> ${b.content}\n\n`;
          break;
        case "callout":
          md += `> [!NOTE]\n> ${b.content}\n\n`;
          break;
        case "divider":
          md += `---\n\n`;
          break;
        default:
          md += `${b.content}\n\n`;
          break;
      }
    });

    navigator.clipboard.writeText(md);
    setExportNotice("Copied Markdown to clipboard!");
    setTimeout(() => setExportNotice(null), 2500);
  };

  const handleExportToFolder = async () => {
    setIsSyncing(true);
    try {
      const res = await notesService.exportNotesToFolder();
      setExportNotice(res.message);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      if (!err?.toString().includes("cancelled")) {
        console.error("Export error:", err);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportMarkdown = async () => {
    setIsSyncing(true);
    try {
      const res = await notesService.importMarkdownNotes();
      setExportNotice(res.message);
      await loadNotesList();
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      if (!err?.toString().includes("cancelled")) {
        console.error("Import error:", err);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] -m-5 overflow-hidden">
      {/* Notes Sidebar */}
      <div className="w-64 border-r border-stone-200/80 dark:border-stone-800/80 bg-[#F5F1EB] dark:bg-[#0E0D0C] flex flex-col shrink-0 select-none">
        <div className="p-3 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Knowledge Hub
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleCreateNewNote}
            className="h-7 px-2.5 text-[11px] bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1 shadow-xs"
          >
            <Plus className="w-3 h-3" />
            New
          </Button>
        </div>

        {/* Search Notes */}
        <div className="p-2.5 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notes..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#141312] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
            />
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center px-4">
              <FileText className="w-6 h-6 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
              <p className="text-xs text-stone-400 dark:text-stone-500">
                No notes found. Click &quot;+ New&quot; to create your first note!
              </p>
            </div>
          ) : (
            filteredNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => loadNoteDetail(n.id)}
                className={`w-full text-left p-2.5 rounded-xl transition flex flex-col gap-1 cursor-pointer ${
                  activeNoteId === n.id
                    ? "bg-stone-200/80 dark:bg-stone-800/80 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold"
                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-200/40 dark:hover:bg-stone-800/40 hover:text-stone-900 dark:hover:text-stone-200"
                }`}
              >
                <span className="text-xs truncate">
                  {n.title || "Untitled Note"}
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                  {n.preview || "Empty note"}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Sidebar Footer: Sync & SRS Actions */}
        <div className="p-2 border-t border-stone-200/80 dark:border-stone-800/80 space-y-1 bg-stone-100/50 dark:bg-stone-900/30">
          <button
            type="button"
            onClick={handleExportToFolder}
            disabled={isSyncing}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition cursor-pointer disabled:opacity-50"
            title="Export all notes as Markdown (.md) files to a folder"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export Notes to Folder</span>
          </button>

          <button
            type="button"
            onClick={handleImportMarkdown}
            disabled={isSyncing}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 transition cursor-pointer disabled:opacity-50"
            title="Import .md files from disk into Knowledge Hub"
          >
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Import Markdown Files</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSrsOpen(true)}
            className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition cursor-pointer"
            title="Practice Spaced Repetition flashcards across your knowledge notes"
          >
            <Brain className="w-3.5 h-3.5 text-amber-500" />
            <span>Review Flashcards</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 overflow-y-auto bg-[#FAF8F5] dark:bg-[#0C0B0A] p-8">
        {!activeNoteId ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
            <BookOpen className="w-10 h-10 text-stone-300 dark:text-stone-700 mb-3" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              Select or Create a Note
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Your personal second brain with movable Notion-style blocks, code snippets, and to-do lists.
            </p>
            <Button
              onClick={handleCreateNewNote}
              className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Note
            </Button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Note Top Bar Actions */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/60 dark:border-stone-800/60">
              <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
                {saveStatus}
              </span>

              <div className="flex items-center gap-2">
                {exportNotice && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {exportNotice}
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/study?noteId=${activeNoteId}`)}
                  className="h-7 text-xs flex items-center gap-1.5 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer"
                  title="Open Split-View Study Studio with this note"
                >
                  <Columns2 className="w-3 h-3 text-amber-500" />
                  <span>Split with Resource</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMarkdown}
                  className="h-7 text-xs flex items-center gap-1 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800"
                >
                  <Copy className="w-3 h-3" />
                  Copy Markdown
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteCurrentNote}
                  className="h-7 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5"
                  title="Delete Note"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => {
                const newT = e.target.value;
                setNoteTitle(newT);
                triggerAutoSave(newT, blocks);
              }}
              placeholder="Note Title..."
              className="w-full text-2xl font-bold bg-transparent border-none text-stone-900 dark:text-stone-100 focus:outline-hidden placeholder:text-stone-300 dark:placeholder:text-stone-700"
            />

            {/* Draggable Blocks Context */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {blocks.map((block) => (
                    <NotionBlock
                      key={block.id}
                      block={block}
                      onChangeContent={handleBlockChangeContent}
                      onToggleTodo={handleToggleTodo}
                      onDeleteBlock={handleDeleteBlock}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onKeyDown={() => {}}
                      onOpenSlashMenu={(id, rect) => {
                        setSlashMenuState({
                          isOpen: true,
                          blockId: id,
                          position: { top: rect.bottom + 4, left: rect.left },
                        });
                      }}
                      onChangeType={(id, newType) => {
                        setBlocks((prev) => {
                          const updated = prev.map((b) =>
                            b.id === id ? { ...b, type: newType } : b
                          );
                          triggerAutoSave(noteTitle, updated);
                          return updated;
                        });
                      }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Bottom Quick Add Block Row */}
            <div className="pt-4 border-t border-dashed border-stone-200 dark:border-stone-800 flex items-center gap-2">
              <button
                onClick={() => handleAddBlock("paragraph")}
                className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Text
              </button>
              <button
                onClick={() => handleAddBlock("todo")}
                className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition cursor-pointer"
              >
                <ListTodo className="w-3 h-3" />
                To-Do
              </button>
              <button
                onClick={() => handleAddBlock("code")}
                className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition cursor-pointer"
              >
                <Code2 className="w-3 h-3" />
                Code
              </button>
              <button
                onClick={() => handleAddBlock("callout")}
                className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Callout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slash Command Menu Overlay */}
      {slashMenuState.isOpen && (
        <SlashMenu
          position={slashMenuState.position}
          onSelect={handleSelectSlashType}
          onClose={() =>
            setSlashMenuState({
              isOpen: false,
              blockId: "",
              position: { top: 0, left: 0 },
            })
          }
        />
      )}

      {/* Spaced Repetition Review Modal */}
      <SrsReviewModal
        isOpen={isSrsOpen}
        onClose={() => setIsSrsOpen(false)}
        onCompletedReview={loadNotesList}
      />
    </div>
  );
};
