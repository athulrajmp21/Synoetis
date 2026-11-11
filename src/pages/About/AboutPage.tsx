import React from "react";
import { Terminal, ShieldCheck, Cpu, Code2, Globe } from "lucide-react";
import { Card } from "@/components/ui/Card";

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-center p-1.5 shadow-md">
          <img src="/logo.png" alt="Synoetis" className="w-full h-full object-contain rounded-xl" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              Synoetis
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-stone-200/80 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium">
              v1.0.1 • Desktop
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Second Brain & Engineering Operating System • From Greek <em>Synoesis</em> (Total Synthetic Mastery)
          </p>
        </div>
      </div>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Core Architectural Principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 dark:text-stone-100 block">
                Local-First & Private
              </strong>
              Zero telemetry. Your data lives on your disk in SQLite. You own every byte.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 dark:text-stone-100 block">
                High Performance Core
              </strong>
              Native Rust Tauri 2 backend with instant load times, minimal RAM footprint, and crash recovery.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Code2 className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 dark:text-stone-100 block">
                Tailored for Engineers
              </strong>
              Built specifically for CS students, software engineers, and technical creators.
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-stone-700 dark:text-stone-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-stone-900 dark:text-stone-100 block">
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
