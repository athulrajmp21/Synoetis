import React, { useState } from "react";
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
  Share2,
  FileText,
  Search,
  CheckCircle2,
  Sparkles,
  Code2,
  Heading,
  ListTodo,
  Tag,
  Copy,
} from "lucide-react";
import { NotionBlock, EditorBlock, BlockType } from "@/components/knowledge/NotionBlock";
import { SlashMenu } from "@/components/knowledge/SlashMenu";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface NoteDocument {
  id: string;
  title: string;
  icon: string;
  tag: string;
  updatedAt: string;
  blocks: EditorBlock[];
}

const INITIAL_DOCUMENTS: NoteDocument[] = [
  {
    id: "doc-rust-ownership",
    title: "Rust Ownership, Borrowing & Lifetimes",
    icon: "🦀",
    tag: "Systems Programming",
    updatedAt: "Today at 9:40 PM",
    blocks: [
      {
        id: "b1",
        type: "callout",
        content:
          "Ownership is Rust's most unique feature. It enables memory safety guarantees without needing a garbage collector.",
        calloutIcon: "💡",
      },
      {
        id: "b2",
        type: "h2",
        content: "Core Ownership Rules",
      },
      {
        id: "b3",
        type: "bullet",
        content: "Each value in Rust has an owner variable.",
      },
      {
        id: "b4",
        type: "bullet",
        content: "There can only be one owner at a time.",
      },
      {
        id: "b5",
        type: "bullet",
        content: "When the owner goes out of scope, the value is dropped (RAII).",
      },
      {
        id: "b6",
        type: "h2",
        content: "Move Semantics vs Copy Trait",
      },
      {
        id: "b7",
        type: "code",
        language: "rust",
        content: `fn main() {
    let s1 = String::from("Life OS");
    let s2 = s1; // Ownership moved to s2! s1 is invalidated here.

    // println!("{}", s1); // Compile error: borrow of moved value: 's1'
    println!("Owned value: {}", s2);
}`,
      },
      {
        id: "b8",
        type: "todo",
        content: "Practice Box, Rc, and Arc smart pointer ownership patterns",
        checked: true,
      },
      {
        id: "b9",
        type: "todo",
        content: "Review non-lexical lifetimes (NLL) and reborrowing semantics",
        checked: false,
      },
    ],
  },
  {
    id: "doc-dsa-patterns",
    title: "DSA Cheatsheet: Two Pointers & Sliding Window",
    icon: "⚡",
    tag: "Algorithms",
    updatedAt: "Yesterday",
    blocks: [
      {
        id: "p1",
        type: "callout",
        content:
          "Use Two Pointers when working with sorted arrays or linked lists to achieve O(N) time with O(1) space.",
        calloutIcon: "🎯",
      },
      {
        id: "p2",
        type: "h2",
        content: "Fast & Slow Pointers (Floyd's Cycle Detection)",
      },
      {
        id: "p3",
        type: "paragraph",
        content:
          "Initialize two pointers at the head. Advance slow by 1 step, fast by 2 steps. If they meet, a cycle exists.",
      },
      {
        id: "p4",
        type: "code",
        language: "rust",
        content: `pub fn has_cycle(head: Option<Box<ListNode>>) -> bool {
    let mut slow = &head;
    let mut fast = &head;
    while let (Some(s), Some(f)) = (slow, fast) {
        // cycle detection logic
    }
    false
}`,
      },
      {
        id: "p5",
        type: "todo",
        content: "Solve LeetCode 141 (Linked List Cycle)",
        checked: true,
      },
      {
        id: "p6",
        type: "todo",
        content: "Solve LeetCode 142 (Linked List Cycle II)",
        checked: true,
      },
    ],
  },
  {
    id: "doc-system-design",
    title: "System Design: Distributed Cache & Invalidation",
    icon: "🌐",
    tag: "Architecture",
    updatedAt: "3 days ago",
    blocks: [
      {
        id: "s1",
        type: "h2",
        content: "Cache Invalidation Strategies",
      },
      {
        id: "s2",
        type: "paragraph",
        content:
          "There are only two hard things in Computer Science: cache invalidation and naming things.",
      },
      {
        id: "s3",
        type: "quote",
        content:
          "Write-through guarantees consistency at the cost of write latency. Cache-aside is best for read-heavy workloads.",
      },
      {
        id: "s4",
        type: "todo",
        content: "Implement LRU Cache using Doubly Linked List + HashMap in Rust",
        checked: false,
      },
    ],
  },
];

export const KnowledgePage: React.FC = () => {
  const [documents, setDocuments] = useState<NoteDocument[]>(INITIAL_DOCUMENTS);
  const [activeDocId, setActiveDocId] = useState<string>(INITIAL_DOCUMENTS[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

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

  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

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

  // Filtered documents for sidebar
  const filteredDocs = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle Drag & Drop reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        const oldIndex = doc.blocks.findIndex((b) => b.id === active.id);
        const newIndex = doc.blocks.findIndex((b) => b.id === over.id);
        return {
          ...doc,
          blocks: arrayMove(doc.blocks, oldIndex, newIndex),
        };
      })
    );
  };

  // Change block content
  const handleBlockChange = (blockId: string, content: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        return {
          ...doc,
          blocks: doc.blocks.map((b) =>
            b.id === blockId ? { ...b, content } : b
          ),
        };
      })
    );
  };

  // Toggle todo item
  const handleToggleTodo = (blockId: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        return {
          ...doc,
          blocks: doc.blocks.map((b) =>
            b.id === blockId ? { ...b, checked: !b.checked } : b
          ),
        };
      })
    );
  };

  // Delete block
  const handleDeleteBlock = (blockId: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        const remaining = doc.blocks.filter((b) => b.id !== blockId);
        // Ensure at least one paragraph remains
        if (remaining.length === 0) {
          remaining.push({
            id: `b-${Date.now()}`,
            type: "paragraph",
            content: "",
          });
        }
        return { ...doc, blocks: remaining };
      })
    );
  };

  // Move block up
  const handleMoveUp = (blockId: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        const index = doc.blocks.findIndex((b) => b.id === blockId);
        if (index <= 0) return doc;
        return {
          ...doc,
          blocks: arrayMove(doc.blocks, index, index - 1),
        };
      })
    );
  };

  // Move block down
  const handleMoveDown = (blockId: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        const index = doc.blocks.findIndex((b) => b.id === blockId);
        if (index === -1 || index >= doc.blocks.length - 1) return doc;
        return {
          ...doc,
          blocks: arrayMove(doc.blocks, index, index + 1),
        };
      })
    );
  };

  // Change block type
  const handleChangeType = (blockId: string, newType: BlockType) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        return {
          ...doc,
          blocks: doc.blocks.map((b) => {
            if (b.id !== blockId) return b;
            let cleanedContent = b.content;
            if (cleanedContent === "/" || cleanedContent.endsWith(" /")) {
              cleanedContent = cleanedContent.replace(/\/$/, "").trim();
            }
            return {
              ...b,
              type: newType,
              content: cleanedContent,
              language: newType === "code" ? (b.language || "rust") : undefined,
              calloutIcon: newType === "callout" ? (b.calloutIcon || "💡") : undefined,
            };
          }),
        };
      })
    );
    setSlashMenuState({ isOpen: false, blockId: "", position: { top: 0, left: 0 } });
  };

  // Keyboard navigation inside block
  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const currentBlock = activeDoc.blocks.find((b) => b.id === blockId);
      // Don't auto-split on enter inside code blocks
      if (currentBlock && currentBlock.type === "code") return;

      e.preventDefault();
      const newBlock: EditorBlock = {
        id: `b-${Date.now()}`,
        type: currentBlock?.type === "todo" ? "todo" : "paragraph",
        content: "",
      };

      setDocuments((prevDocs) =>
        prevDocs.map((doc) => {
          if (doc.id !== activeDocId) return doc;
          const index = doc.blocks.findIndex((b) => b.id === blockId);
          const newBlocks = [...doc.blocks];
          newBlocks.splice(index + 1, 0, newBlock);
          return { ...doc, blocks: newBlocks };
        })
      );
    } else if (e.key === "Backspace") {
      const currentBlock = activeDoc.blocks.find((b) => b.id === blockId);
      if (currentBlock && currentBlock.content === "" && activeDoc.blocks.length > 1) {
        e.preventDefault();
        handleDeleteBlock(blockId);
      }
    }
  };

  // Open slash menu
  const handleOpenSlashMenu = (blockId: string, rect: DOMRect) => {
    setSlashMenuState({
      isOpen: true,
      blockId,
      position: { top: rect.bottom, left: rect.left },
    });
  };

  // Add a block to the end of document
  const handleAddBlockBottom = (type: BlockType = "paragraph") => {
    const newBlock: EditorBlock = {
      id: `b-${Date.now()}`,
      type,
      content: "",
      calloutIcon: type === "callout" ? "💡" : undefined,
      language: type === "code" ? "rust" : undefined,
    };

    setDocuments((prevDocs) =>
      prevDocs.map((doc) => {
        if (doc.id !== activeDocId) return doc;
        return {
          ...doc,
          blocks: [...doc.blocks, newBlock],
        };
      })
    );
  };

  // Create new document
  const handleCreateDocument = () => {
    const newDocId = `doc-${Date.now()}`;
    const newDoc: NoteDocument = {
      id: newDocId,
      title: "Untitled Note",
      icon: "📝",
      tag: "General",
      updatedAt: "Just now",
      blocks: [
        {
          id: `b-${Date.now()}`,
          type: "h1",
          content: "Untitled Note",
        },
        {
          id: `b-${Date.now() + 1}`,
          type: "paragraph",
          content: "Type '/' to select block types or start typing...",
        },
      ],
    };

    setDocuments([newDoc, ...documents]);
    setActiveDocId(newDocId);
  };

  // Update doc title
  const handleUpdateDocTitle = (newTitle: string) => {
    setDocuments((prevDocs) =>
      prevDocs.map((doc) =>
        doc.id === activeDocId ? { ...doc, title: newTitle } : doc
      )
    );
  };

  // Delete active document
  const handleDeleteDocument = (docId: string) => {
    if (documents.length <= 1) return;
    const remaining = documents.filter((d) => d.id !== docId);
    setDocuments(remaining);
    setActiveDocId(remaining[0].id);
  };

  // Export note to Markdown
  const handleExportMarkdown = () => {
    let md = `# ${activeDoc.icon} ${activeDoc.title}\n\n`;
    md += `*Tag: ${activeDoc.tag} | Updated: ${activeDoc.updatedAt}*\n\n---\n\n`;

    activeDoc.blocks.forEach((b) => {
      if (b.type === "h1") md += `# ${b.content}\n\n`;
      else if (b.type === "h2") md += `## ${b.content}\n\n`;
      else if (b.type === "h3") md += `### ${b.content}\n\n`;
      else if (b.type === "paragraph") md += `${b.content}\n\n`;
      else if (b.type === "todo")
        md += `- [${b.checked ? "x" : " "}] ${b.content}\n`;
      else if (b.type === "bullet") md += `- ${b.content}\n`;
      else if (b.type === "code")
        md += `\`\`\`${b.language || "text"}\n${b.content}\n\`\`\`\n\n`;
      else if (b.type === "quote") md += `> ${b.content}\n\n`;
      else if (b.type === "callout") md += `> 💡 **Note:** ${b.content}\n\n`;
      else if (b.type === "divider") md += `---\n\n`;
    });

    navigator.clipboard.writeText(md);
    setExportNotice("Markdown copied to clipboard!");
    setTimeout(() => setExportNotice(null), 2500);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] -m-6 overflow-hidden bg-white dark:bg-slate-950">
      {/* Knowledge Sidebar / Notes Tree */}
      <aside className="w-72 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/30 flex flex-col justify-between select-none">
        <div className="p-3 border-b border-slate-200/60 dark:border-slate-800/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                Knowledge Hub
              </span>
            </div>
            <button
              onClick={handleCreateDocument}
              title="Create new note"
              className="p-1 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Note Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Note List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredDocs.map((doc) => {
            const isActive = doc.id === activeDocId;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                  isActive
                    ? "bg-white dark:bg-slate-800 shadow-xs border border-slate-200/80 dark:border-slate-700 font-medium"
                    : "hover:bg-slate-100/70 dark:hover:bg-slate-900/60 text-slate-600 dark:text-slate-400"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0">{doc.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs truncate text-slate-800 dark:text-slate-200">
                      {doc.title || "Untitled"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {doc.tag}
                      </span>
                    </div>
                  </div>
                </div>

                {documents.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc.id);
                    }}
                    title="Delete note"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>{documents.length} Notes</span>
          <span className="font-mono">Local-First</span>
        </div>
      </aside>

      {/* Main Notion-Style Document Editor Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Editor Top Toolbar */}
        <header className="h-12 border-b border-slate-100 dark:border-slate-800/80 px-8 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xs select-none">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="text-base">{activeDoc.icon}</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {activeDoc.title}
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <Badge variant="accent" size="sm">
              {activeDoc.tag}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {exportNotice && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {exportNotice}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMarkdown}
              className="text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Markdown</span>
            </Button>
          </div>
        </header>

        {/* Document Content Canvas */}
        <div className="flex-1 max-w-3xl w-full mx-auto px-8 py-8 space-y-4">
          {/* Note Title Input */}
          <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none cursor-pointer">
                {activeDoc.icon}
              </span>
              <input
                type="text"
                value={activeDoc.title}
                onChange={(e) => handleUpdateDocTitle(e.target.value)}
                placeholder="Note Title"
                className="w-full text-3xl font-extrabold tracking-tight bg-transparent outline-none text-slate-900 dark:text-slate-50 placeholder:text-slate-300 dark:placeholder:text-slate-700"
              />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> {activeDoc.tag}
              </span>
              <span>•</span>
              <span>Updated {activeDoc.updatedAt}</span>
              <span>•</span>
              <span>{activeDoc.blocks.length} blocks</span>
            </div>
          </div>

          {/* DnD Context & Sortable Block List */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeDoc.blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {activeDoc.blocks.map((block) => (
                  <NotionBlock
                    key={block.id}
                    block={block}
                    onChangeContent={handleBlockChange}
                    onToggleTodo={handleToggleTodo}
                    onDeleteBlock={handleDeleteBlock}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onKeyDown={handleKeyDown}
                    onOpenSlashMenu={handleOpenSlashMenu}
                    onChangeType={handleChangeType}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Quick Add Block Bar */}
          <div className="pt-6 pb-12 flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => handleAddBlockBottom("paragraph")}
              className="px-3 py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Block (or type '/')</span>
            </button>
            <button
              onClick={() => handleAddBlockBottom("h2")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
            >
              <Heading className="w-3 h-3" />
              <span>Heading</span>
            </button>
            <button
              onClick={() => handleAddBlockBottom("todo")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
            >
              <ListTodo className="w-3 h-3" />
              <span>To-do</span>
            </button>
            <button
              onClick={() => handleAddBlockBottom("code")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
            >
              <Code2 className="w-3 h-3" />
              <span>Code</span>
            </button>
            <button
              onClick={() => handleAddBlockBottom("callout")}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Callout</span>
            </button>
          </div>
        </div>
      </main>

      {/* Floating Slash Command Popup */}
      {slashMenuState.isOpen && (
        <SlashMenu
          position={slashMenuState.position}
          onSelect={(type) => handleChangeType(slashMenuState.blockId, type)}
          onClose={() =>
            setSlashMenuState({
              isOpen: false,
              blockId: "",
              position: { top: 0, left: 0 },
            })
          }
        />
      )}
    </div>
  );
};
