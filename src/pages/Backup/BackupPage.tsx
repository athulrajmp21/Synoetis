import React from "react";
import { DatabaseBackup, HardDrive, Download, Upload, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const BackupPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
            <DatabaseBackup className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Backup & Data Portability
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Local-first data safety: full SQLite database snapshot, JSON export, and recovery.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Download className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Export Database Snapshot
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Creates an atomic copy of your local <code>lifeos.db</code> SQLite file, safe for cold storage or external drive backup.
          </p>
          <Button variant="primary" size="sm" onClick={() => alert("Scheduled for Phase 6 Native Tauri Dialog Integration")}>
            Export .db Snapshot
          </Button>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Upload className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Restore from Backup
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Restores application state from a previously exported SQLite snapshot or JSON data archive.
          </p>
          <Button variant="outline" size="sm" onClick={() => alert("Scheduled for Phase 6 Native Tauri Dialog Integration")}>
            Restore Snapshot
          </Button>
        </Card>
      </div>
    </div>
  );
};
