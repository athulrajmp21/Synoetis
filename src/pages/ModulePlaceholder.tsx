import React from "react";
import { LucideIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  phase: string;
  tableName?: string;
  description: string;
  plannedFeatures: string[];
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  icon: Icon,
  title,
  phase,
  description,
  plannedFeatures,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300/60 dark:border-stone-700/60">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              {title}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 rounded-xl bg-[#F3EFEA] dark:bg-[#191816] text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-800/80 font-medium">
          {phase}
        </span>
      </div>

      {/* Feature Blueprint */}
      <Card>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
          <Sparkles className="w-4 h-4 text-stone-600 dark:text-stone-400" />
          <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Planned Architecture & Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plannedFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-xl border border-stone-200/60 dark:border-stone-800/60 bg-white dark:bg-[#0C0B0A]"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-stone-800 dark:bg-stone-200 mt-1.5 shrink-0" />
              <span className="text-xs text-stone-700 dark:text-stone-300">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
