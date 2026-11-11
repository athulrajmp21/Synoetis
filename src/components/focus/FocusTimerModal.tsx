import React from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  X,
  Coffee,
  Sparkles,
  Zap,
} from "lucide-react";
import { useFocusTimerStore, FocusMode } from "@/stores/useFocusTimerStore";

export const FocusTimerModal: React.FC = () => {
  const {
    mode,
    timeLeft,
    duration,
    isRunning,
    isModalOpen,
    completedSessionsToday,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    setModalOpen,
  } = useFocusTimerStore();

  if (!isModalOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progressPercent = Math.round(((duration - timeLeft) / duration) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden text-center">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            <h3 className="text-xs font-semibold text-stone-900 dark:text-stone-100">
              Focus & Deep Work
            </h3>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F3EFEA] dark:bg-[#191816] mb-6 text-xs">
          <button
            type="button"
            onClick={() => setMode("pomodoro")}
            className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
              mode === "pomodoro"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>25m</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("deepwork")}
            className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
              mode === "deepwork"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>50m</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("shortbreak")}
            className={`py-1.5 px-2 rounded-lg font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
              mode === "shortbreak"
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs"
                : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>Break</span>
          </button>
        </div>

        {/* Big Countdown Display */}
        <div className="py-6 my-2 rounded-2xl bg-white dark:bg-[#0C0B0A] border border-stone-200/80 dark:border-stone-800/80 shadow-xs">
          <div className="text-5xl font-mono font-bold tracking-tight text-stone-900 dark:text-stone-100">
            {timeFormatted}
          </div>
          <span className="text-[11px] text-stone-400 uppercase tracking-widest mt-2 block font-medium">
            {mode === "deepwork"
              ? "Deep Work Session"
              : mode === "pomodoro"
              ? "Focus Sprint"
              : "Recharge Break"}
          </span>

          {/* Progress Bar */}
          <div className="w-3/4 mx-auto h-1.5 bg-stone-200/60 dark:bg-stone-800 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-stone-900 dark:bg-stone-100 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={resetTimer}
            title="Reset timer"
            className="p-3 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:border-stone-300 dark:hover:border-stone-700 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {isRunning ? (
            <button
              type="button"
              onClick={pauseTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-semibold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 font-semibold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Focus</span>
            </button>
          )}
        </div>

        {/* Stats footer */}
        <div className="mt-6 pt-3 border-t border-stone-200/60 dark:border-stone-800/60 text-[11px] text-stone-400">
          Completed Today:{" "}
          <span className="font-semibold text-stone-700 dark:text-stone-300 font-mono">
            {completedSessionsToday} sessions
          </span>
        </div>
      </div>
    </div>
  );
};
