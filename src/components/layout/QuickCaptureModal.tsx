import React, { useState } from "react";
import { X, CheckSquare, BookOpen, Lightbulb, Check } from "lucide-react";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { Button } from "@/components/ui/Button";
import { taskService, notesService } from "@/services/api";

export const QuickCaptureModal: React.FC = () => {
  const { isQuickCaptureOpen, setQuickCaptureOpen } = useNavigationStore();
  const [type, setType] = useState<"task" | "note" | "idea">("task");
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!isQuickCaptureOpen) return null;

  const handleSave = async () => {
    if (!content.trim()) return;

    try {
      if (type === "task") {
        await taskService.createTask({
          title: content.trim(),
          priority: "medium",
          category: "General",
        });
      } else {
        const blocks = [
          {
            id: crypto.randomUUID(),
            type: "h2",
            content: type === "note" ? "Quick Note" : "Quick Idea",
          },
          { id: crypto.randomUUID(), type: "paragraph", content: content.trim() },
        ];
        await notesService.saveNote(
          null,
          content.trim().slice(0, 40) || "Quick Capture",
          JSON.stringify(blocks)
        );
      }

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setContent("");
        setQuickCaptureOpen(false);
        window.dispatchEvent(new Event("lifeos_refresh"));
      }, 500);
    } catch (e) {
      console.error("Failed to quick capture:", e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl p-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800/80">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-stone-900 dark:text-stone-100">
              Quick Capture
            </span>
          </div>
          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capture Type Pills */}
        <div className="flex items-center gap-2 my-4">
          <button
            onClick={() => setType("task")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              type === "task"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs font-semibold"
                : "bg-white dark:bg-[#0C0B0A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Task
          </button>
          <button
            onClick={() => setType("note")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              type === "note"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs font-semibold"
                : "bg-white dark:bg-[#0C0B0A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Note
          </button>
          <button
            onClick={() => setType("idea")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              type === "idea"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs font-semibold"
                : "bg-white dark:bg-[#0C0B0A] text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            Idea
          </button>
        </div>

        {/* Input Text Area */}
        <textarea
          autoFocus
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === "task"
              ? "e.g., Review Operating Systems lecture slides..."
              : type === "note"
              ? "Draft quick reflection or code snippet..."
              : "Capture rapid insight or career goal..."
          }
          className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 outline-none focus:ring-1 focus:ring-stone-400 resize-none font-mono"
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickCaptureOpen(false)}
            className="text-xs text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
          >
            Cancel
          </Button>
          <button
            onClick={handleSave}
            disabled={!content.trim() || isSaved}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 rounded-xl transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Captured!
              </>
            ) : (
              "Capture"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
