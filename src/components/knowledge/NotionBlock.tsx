import React, { useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Trash2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export type BlockType =
  | "h1"
  | "h2"
  | "h3"
  | "paragraph"
  | "todo"
  | "code"
  | "callout"
  | "quote"
  | "bullet"
  | "divider";

export interface EditorBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  calloutIcon?: string;
}

interface NotionBlockProps {
  block: EditorBlock;
  onChangeContent: (id: string, content: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onKeyDown: (e: React.KeyboardEvent, id: string) => void;
  onOpenSlashMenu: (id: string, rect: DOMRect) => void;
  onChangeType: (id: string, newType: BlockType) => void;
}

export const NotionBlock: React.FC<NotionBlockProps> = ({
  block,
  onChangeContent,
  onToggleTodo,
  onDeleteBlock,
  onMoveUp,
  onMoveDown,
  onKeyDown,
  onOpenSlashMenu,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const [copied, setCopied] = React.useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [block.content]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(block.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    onChangeContent(block.id, val);

    // If user typed slash at the beginning
    if (val === "/" || val.endsWith(" /")) {
      if (textareaRef.current) {
        onOpenSlashMenu(block.id, textareaRef.current.getBoundingClientRect());
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-start gap-1 py-1 rounded-lg transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
    >
      {/* Left Control Bar (Drag Handle & Quick Reorder) */}
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity pt-1 select-none shrink-0">
        <button
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing rounded hover:bg-slate-200/60 dark:hover:bg-slate-800"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col -space-y-1">
          <button
            onClick={() => onMoveUp(block.id)}
            title="Move up"
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            onClick={() => onMoveDown(block.id)}
            title="Move down"
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={() => onDeleteBlock(block.id)}
          title="Delete block"
          className="p-1 ml-0.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Block Body Content */}
      <div className="flex-1 min-w-0 px-2">
        {/* Divider */}
        {block.type === "divider" && (
          <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
        )}

        {/* Heading 1 */}
        {block.type === "h1" && (
          <textarea
            ref={textareaRef}
            rows={1}
            value={block.content}
            onChange={handleInput}
            onKeyDown={(e) => onKeyDown(e, block.id)}
            placeholder="Heading 1..."
            className="w-full bg-transparent resize-none outline-none font-bold text-2xl text-slate-900 dark:text-slate-50 placeholder:text-slate-300 dark:placeholder:text-slate-700 leading-tight"
          />
        )}

        {/* Heading 2 */}
        {block.type === "h2" && (
          <textarea
            ref={textareaRef}
            rows={1}
            value={block.content}
            onChange={handleInput}
            onKeyDown={(e) => onKeyDown(e, block.id)}
            placeholder="Heading 2..."
            className="w-full bg-transparent resize-none outline-none font-bold text-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-700 leading-snug"
          />
        )}

        {/* Heading 3 */}
        {block.type === "h3" && (
          <textarea
            ref={textareaRef}
            rows={1}
            value={block.content}
            onChange={handleInput}
            onKeyDown={(e) => onKeyDown(e, block.id)}
            placeholder="Heading 3..."
            className="w-full bg-transparent resize-none outline-none font-semibold text-base text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
        )}

        {/* Paragraph */}
        {block.type === "paragraph" && (
          <textarea
            ref={textareaRef}
            rows={1}
            value={block.content}
            onChange={handleInput}
            onKeyDown={(e) => onKeyDown(e, block.id)}
            placeholder="Type '/' for commands..."
            className="w-full bg-transparent resize-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-700 leading-relaxed"
          />
        )}

        {/* Todo Checkbox */}
        {block.type === "todo" && (
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={block.checked || false}
              onChange={() => onToggleTodo(block.id)}
              className="mt-1 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <textarea
              ref={textareaRef}
              rows={1}
              value={block.content}
              onChange={handleInput}
              onKeyDown={(e) => onKeyDown(e, block.id)}
              placeholder="To-do item..."
              className={`flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed ${
                block.checked
                  ? "line-through text-slate-400 dark:text-slate-500"
                  : "text-slate-800 dark:text-slate-200"
              }`}
            />
          </div>
        )}

        {/* Bullet Item */}
        {block.type === "bullet" && (
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500 mt-2 shrink-0" />
            <textarea
              ref={textareaRef}
              rows={1}
              value={block.content}
              onChange={handleInput}
              onKeyDown={(e) => onKeyDown(e, block.id)}
              placeholder="List item..."
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
            />
          </div>
        )}

        {/* Code Block */}
        {block.type === "code" && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="font-semibold text-indigo-400 uppercase">
                {block.language || "Rust"}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              ref={textareaRef}
              rows={3}
              value={block.content}
              onChange={handleInput}
              onKeyDown={(e) => onKeyDown(e, block.id)}
              placeholder="// Write or paste code snippet here..."
              className="w-full p-3 bg-transparent font-mono text-xs text-slate-200 resize-none outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Callout Box */}
        {block.type === "callout" && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/60 dark:bg-indigo-950/30">
            <span className="text-lg select-none">
              {block.calloutIcon || "💡"}
            </span>
            <textarea
              ref={textareaRef}
              rows={1}
              value={block.content}
              onChange={handleInput}
              onKeyDown={(e) => onKeyDown(e, block.id)}
              placeholder="Callout note or key insight..."
              className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 leading-relaxed"
            />
          </div>
        )}

        {/* Quote Block */}
        {block.type === "quote" && (
          <div className="flex items-start gap-3 pl-3 border-l-3 border-indigo-500">
            <textarea
              ref={textareaRef}
              rows={1}
              value={block.content}
              onChange={handleInput}
              onKeyDown={(e) => onKeyDown(e, block.id)}
              placeholder="Quote or theorem..."
              className="flex-1 bg-transparent resize-none outline-none italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed"
            />
          </div>
        )}
      </div>
    </div>
  );
};
