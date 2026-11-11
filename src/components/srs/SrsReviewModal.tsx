import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Brain,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Code2,
  BookOpen,
  Eye,
  Award,
  Zap,
} from "lucide-react";
import { SrsItem } from "@/types/models";
import { srsService } from "@/services/api";
import { Button } from "@/components/ui/Button";

interface SrsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompletedReview?: () => void;
  initialItems?: SrsItem[];
}

export const SrsReviewModal: React.FC<SrsReviewModalProps> = ({
  isOpen,
  onClose,
  onCompletedReview,
  initialItems,
}) => {
  const [items, setItems] = useState<SrsItem[]>(initialItems || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!initialItems || initialItems.length === 0) {
        loadDueItems();
      } else {
        setItems(initialItems);
        setCurrentIndex(0);
        setIsRevealed(false);
        setSessionCompleted(false);
      }
    }
  }, [isOpen, initialItems]);

  const loadDueItems = async () => {
    try {
      const overview = await srsService.getOverview();
      setItems(overview.due_items);
      setCurrentIndex(0);
      setIsRevealed(false);
      setSessionCompleted(overview.due_items.length === 0);
    } catch (err) {
      console.error("Failed to load SRS items:", err);
    }
  };

  const currentItem = items[currentIndex];

  const handleRating = async (rating: "again" | "hard" | "good" | "easy") => {
    if (!currentItem || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await srsService.submitReview({
        item_type: currentItem.item_type,
        item_id: currentItem.item_id,
        rating,
      });

      if (currentIndex + 1 < items.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsRevealed(false);
      } else {
        setSessionCompleted(true);
        if (onCompletedReview) {
          onCompletedReview();
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || sessionCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === " " && !isRevealed) {
        e.preventDefault();
        setIsRevealed(true);
      } else if (isRevealed) {
        if (e.key === "1") handleRating("again");
        else if (e.key === "2") handleRating("hard");
        else if (e.key === "3") handleRating("good");
        else if (e.key === "4") handleRating("easy");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isRevealed, sessionCompleted, currentItem, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#FAF8F5] dark:bg-[#121110] border border-stone-200/90 dark:border-stone-800/90 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Spaced Repetition Review (SRS)
                {items.length > 0 && !sessionCompleted && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-mono">
                    {currentIndex + 1} of {items.length}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        {items.length > 0 && !sessionCompleted && (
          <div className="w-full h-1 bg-stone-200 dark:bg-stone-800 shrink-0">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{
                width: `${((currentIndex) / items.length) * 100}%`,
              }}
            />
          </div>
        )}

        {/* Modal Body */}
        {sessionCompleted ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                All Reviews Completed for Today!
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-sm mx-auto">
                You have strengthened your memory retention across all scheduled DSA problems and notes. Next reviews will be automatically scheduled.
              </p>
            </div>
            <Button
              onClick={onClose}
              className="bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 text-xs px-5 py-2"
            >
              Back to Workspace
            </Button>
          </div>
        ) : !currentItem ? (
          <div className="p-8 text-center text-xs text-stone-400 my-auto">
            No items are due for spaced repetition review today!
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-5 space-y-5">
            {/* Flashcard Header Metadata */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30">
                {currentItem.item_type === "dsa" ? "DSA Problem" : "Knowledge Note"}
              </span>

              {currentItem.difficulty && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700">
                  {currentItem.difficulty}
                </span>
              )}

              <span className="text-[10px] font-mono text-stone-400">
                Stage {currentItem.review_stage} (Interval {currentItem.review_stage === 1 ? "1d" : currentItem.review_stage === 2 ? "3d" : currentItem.review_stage === 3 ? "7d" : currentItem.review_stage === 4 ? "14d" : "30d+"})
              </span>
            </div>

            {/* Prompt / Question */}
            <div className="bg-white dark:bg-[#0E0D0C] p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                {currentItem.title}
              </h3>
              {currentItem.subtitle && (
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  {currentItem.subtitle}
                </p>
              )}
            </div>

            {/* Answer / Solution Reveal Container */}
            {!isRevealed ? (
              <div className="text-center py-6">
                <button
                  type="button"
                  onClick={() => setIsRevealed(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-xs hover:bg-amber-600 transition shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Show Answer / Solution (Space)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-98 duration-150">
                <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-[#F5F2EB] dark:bg-[#0A0908] p-4">
                  <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Memory Recall & Notes</span>
                  </div>
                  <pre className="text-xs font-mono text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                    {currentItem.content_preview || "No solution notes logged for this item yet."}
                  </pre>
                </div>

                {/* Rating Button Row */}
                <div className="pt-2">
                  <div className="text-[11px] font-medium text-stone-500 text-center mb-2.5">
                    How well did you remember this?
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleRating("again")}
                      className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 transition text-center cursor-pointer disabled:opacity-50"
                    >
                      <div className="text-xs font-bold">Again</div>
                      <div className="text-[10px] opacity-70 mt-0.5">1d (<kbd>1</kbd>)</div>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleRating("hard")}
                      className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition text-center cursor-pointer disabled:opacity-50"
                    >
                      <div className="text-xs font-bold">Hard</div>
                      <div className="text-[10px] opacity-70 mt-0.5">2d (<kbd>2</kbd>)</div>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleRating("good")}
                      className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 transition text-center cursor-pointer disabled:opacity-50"
                    >
                      <div className="text-xs font-bold">Good</div>
                      <div className="text-[10px] opacity-70 mt-0.5">7d (<kbd>3</kbd>)</div>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleRating("easy")}
                      className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 dark:text-blue-300 transition text-center cursor-pointer disabled:opacity-50"
                    >
                      <div className="text-xs font-bold">Easy</div>
                      <div className="text-[10px] opacity-70 mt-0.5">14d+ (<kbd>4</kbd>)</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer shortcuts strip */}
        <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400 shrink-0">
          <span>Shortcuts: Space to flip, 1-4 to rate</span>
          <kbd className="px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-stone-800 font-mono text-[9px]">
            ESC to exit
          </kbd>
        </div>
      </div>
    </div>
  );
};
