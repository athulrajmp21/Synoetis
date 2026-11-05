import React from "react";
import { LucideIcon, CheckCircle2, Database, Sparkles, Layers } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface ModulePlaceholderProps {
  icon: LucideIcon;
  title: string;
  phase: string;
  tableName: string;
  description: string;
  plannedFeatures: string[];
}

export const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({
  icon: Icon,
  title,
  phase,
  tableName,
  description,
  plannedFeatures,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <Badge variant="accent" size="md">
          {phase}
        </Badge>
      </div>

      {/* Database Schema Status Box */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-emerald-500" />
          <div>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              SQLite Schema Ready
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Table <code className="text-indigo-500">{tableName}</code> defined & indexed in lifeos.db
            </p>
          </div>
        </div>
        <span className="text-xs text-emerald-500 font-mono font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Migration 001 Applied
        </span>
      </div>

      {/* Planned Feature Blueprint */}
      <Card>
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Phase Implementation Blueprint
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plannedFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                {feat}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
