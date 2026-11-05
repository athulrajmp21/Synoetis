import React, { useState } from "react";
import { X, CheckSquare, BookOpen, Lightbulb, Check } from "lucide-react";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { Button } from "@/components/ui/Button";

export const QuickCaptureModal: React.FC = () => {
  const { isQuickCaptureOpen, setQuickCaptureOpen } = useNavigationStore();
  const [type, setType] = useState<"task" | "note" | "idea">("task");
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  if (!isQuickCaptureOpen) return null;

  const handleSave = () => {
    if (!content.trim()) return;
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setContent("");
      setQuickCaptureOpen(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-28 bg-slate-950/40 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Quick Capture
            </span>
          </div>
          <button
            onClick={() => setQuickCaptureOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Capture Type Pills */}
        <div className="flex items-center gap-2 my-4">
          <button
            onClick={() => setType("task")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              type === "task"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Task
          </button>
          <button
            onClick={() => setType("note")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              type === "note"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Note
          </button>
          <button
            onClick={() => setType("idea")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              type === "idea"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
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
              ? "e.g., Implement Dijkstra graph algorithm for assignment #2..."
              : type === "note"
              ? "Draft quick reflection or code snippet..."
              : "Capture rapid insight or career goal..."
          }
          className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-indigo-500 resize-none"
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuickCaptureOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!content.trim() || isSaved}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" /> Saved!
              </>
            ) : (
              "Capture"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
