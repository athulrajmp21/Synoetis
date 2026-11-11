import React from "react";

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "easy" | "medium" | "hard";

interface DifficultyDotProps {
  difficulty: string;
  showText?: boolean;
  className?: string;
}

export const DifficultyDot: React.FC<DifficultyDotProps> = ({
  difficulty,
  showText = true,
  className = "",
}) => {
  const norm = difficulty.toLowerCase();

  let dotColor = "bg-stone-400";
  let textColor = "text-stone-600 dark:text-stone-400";
  let label = "Easy";

  if (norm === "easy") {
    dotColor = "bg-emerald-500 shadow-xs shadow-emerald-500/20";
    textColor = "text-emerald-700 dark:text-emerald-400";
    label = "Easy";
  } else if (norm === "medium") {
    dotColor = "bg-amber-500 shadow-xs shadow-amber-500/20";
    textColor = "text-amber-700 dark:text-amber-400";
    label = "Medium";
  } else if (norm === "hard") {
    dotColor = "bg-rose-500 shadow-xs shadow-rose-500/20";
    textColor = "text-rose-700 dark:text-rose-400";
    label = "Hard";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${textColor} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {showText && <span>{label}</span>}
    </span>
  );
};
