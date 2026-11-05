import React from "react";
import { Terminal, ShieldCheck, Cpu, Code2, Globe } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md">
          <Terminal className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Life OS
            </h1>
            <Badge variant="accent" size="sm">
              v0.1.0 • Desktop
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personal Productivity & Knowledge Management Operating System
          </p>
        </div>
      </div>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Core Principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-slate-200 block">
                Local-First & Private
              </strong>
              Zero telemetry. Your data lives on your disk in SQLite. You own every byte.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-slate-200 block">
                High Performance Core
              </strong>
              Native Rust Tauri backend with instant load times, minimal RAM footprint, and crash recovery.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Code2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-slate-200 block">
                Tailored for Engineers
              </strong>
              Built specifically for CS students, software engineers, and technical creators.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 dark:text-slate-200 block">
                Offline Independence
              </strong>
              Works 100% offline in libraries, lecture halls, or transit.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
