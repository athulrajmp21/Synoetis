import React from "react";
import { Flame, AlertCircle } from "lucide-react";

export type PriorityLevel = "urgent" | "high" | "medium" | "low";

interface PriorityIconProps {
  priority: string;
  showLabel?: boolean;
  className?: string;
}

export const PriorityIcon: React.FC<PriorityIconProps> = ({
  priority,
  showLabel = false,
  className = "",
}) => {
  const norm = priority.toLowerCase() as PriorityLevel;

  switch (norm) {
    case "urgent":
      return (
        <div className={`inline-flex items-center gap-1.5 text-rose-500 dark:text-rose-400 ${className}`} title="Urgent Priority">
          <Flame className="w-3.5 h-3.5 fill-rose-500/20" />
          {showLabel && <span className="text-[11px] font-medium">Urgent</span>}
        </div>
      );
    case "high":
      return (
        <div className={`inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 ${className}`} title="High Priority">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 h-1.5 bg-amber-500 rounded-xs" />
            <span className="w-1 h-2.5 bg-amber-500 rounded-xs" />
            <span className="w-1 h-3 bg-amber-500 rounded-xs" />
          </div>
          {showLabel && <span className="text-[11px] font-medium">High</span>}
        </div>
      );
    case "medium":
      return (
        <div className={`inline-flex items-center gap-1.5 text-stone-500 dark:text-stone-400 ${className}`} title="Medium Priority">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 h-1.5 bg-stone-400 dark:bg-stone-500 rounded-xs" />
            <span className="w-1 h-2.5 bg-stone-400 dark:bg-stone-500 rounded-xs" />
            <span className="w-1 h-3 bg-stone-200 dark:bg-stone-700 rounded-xs" />
          </div>
          {showLabel && <span className="text-[11px] font-medium">Medium</span>}
        </div>
      );
    case "low":
    default:
      return (
        <div className={`inline-flex items-center gap-1.5 text-stone-400 dark:text-stone-500 ${className}`} title="Low Priority">
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 h-1.5 bg-stone-300 dark:bg-stone-600 rounded-xs" />
            <span className="w-1 h-2.5 bg-stone-200 dark:bg-stone-800 rounded-xs" />
            <span className="w-1 h-3 bg-stone-200 dark:bg-stone-800 rounded-xs" />
          </div>
          {showLabel && <span className="text-[11px] font-medium">Low</span>}
        </div>
      );
  }
};
