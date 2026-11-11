import React, { useState, useEffect } from "react";
import {
  DatabaseBackup,
  HardDrive,
  Download,
  Upload,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  FolderArchive,
  RefreshCw,
  AlertCircle,
  X,
  FileCheck2,
  Check,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { backupService } from "@/services/api";
import { BackupInfo, BackupValidationResult, RestoreResult } from "@/types/models";

export const BackupPage: React.FC = () => {
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingDb, setExportingDb] = useState(false);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore state
  const [isValidating, setIsValidating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [restoreResult, setRestoreResult] = useState<RestoreResult | null>(null);

  const loadInfo = async () => {
    try {
      const info = await backupService.getBackupInfo();
      setBackupInfo(info);
    } catch (e) {
      console.error("Failed to load backup info:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const handleExportDb = async () => {
    setExportingDb(true);
    setExportSuccessMessage(null);
    setErrorMessage(null);
    try {
      const exportedPath = await backupService.exportDatabaseBackup();
      setExportSuccessMessage(`SQLite database snapshot successfully exported to: ${exportedPath}`);
      await loadInfo();
    } catch (e: any) {
      console.error("Failed to export database:", e);
      setErrorMessage(typeof e === "string" ? e : e?.message || "Database export failed.");
    } finally {
      setExportingDb(false);
    }
  };

  const handleExportJson = async () => {
    setExportingJson(true);
    setExportSuccessMessage(null);
    setErrorMessage(null);
    try {
      const exportedPath = await backupService.exportJsonArchive();
      setExportSuccessMessage(`Full JSON data archive successfully exported to: ${exportedPath}`);
    } catch (e: any) {
      console.error("Failed to export JSON archive:", e);
      setErrorMessage(typeof e === "string" ? e : e?.message || "JSON export failed.");
    } finally {
      setExportingJson(false);
    }
  };

  const handlePickAndValidateBackup = async () => {
    setErrorMessage(null);
    setExportSuccessMessage(null);
    setRestoreResult(null);

    try {
      const selectedPath = await backupService.pickBackupFile();
      if (!selectedPath) return;

      setIsValidating(true);
      const val = await backupService.validateBackupFile(selectedPath);
      setValidationResult(val);

      if (!val.is_valid && val.error_message) {
        setErrorMessage(val.error_message);
      }
    } catch (e: any) {
      console.error("Failed to validate backup file:", e);
      setErrorMessage(typeof e === "string" ? e : e?.message || "Failed to validate backup file.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!validationResult || !validationResult.is_valid) return;

    setIsRestoring(true);
    setErrorMessage(null);
    try {
      const result = await backupService.restoreDatabaseFromBackup(validationResult.file_path);
      setRestoreResult(result);
      setValidationResult(null);
      setExportSuccessMessage(result.message);
      await loadInfo();
    } catch (e: any) {
      console.error("Failed to restore database:", e);
      setErrorMessage(typeof e === "string" ? e : e?.message || "Database restore failed.");
    } finally {
      setIsRestoring(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
            <DatabaseBackup className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Backup & Data Portability
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                Local-First
              </span>
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Zero cloud lock-in: atomic SQLite snapshots, portable JSON exports, and seamless 1-click database restore.
            </p>
          </div>
        </div>

        <Button
          onClick={loadInfo}
          variant="outline"
          size="sm"
          className="flex items-center gap-1.5 text-xs cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stats</span>
        </Button>
      </div>

      {/* Success Notification Banner */}
      {exportSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-start gap-3 shadow-2xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono break-all leading-relaxed">
            {exportSuccessMessage}
            {restoreResult?.safety_backup_path && (
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-sans">
                🛡️ Automatic pre-restore rollback backup preserved at:{" "}
                <span className="font-mono">{restoreResult.safety_backup_path}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setExportSuccessMessage(null)}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3 shadow-2xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-mono break-all leading-relaxed">
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Actions Grid: 1 Restore + 2 Exports */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Restore Database from Backup (FEATURED) */}
        <div className="rounded-2xl p-5 bg-gradient-to-b from-amber-500/10 to-transparent dark:from-amber-500/5 bg-white dark:bg-[#141312] border-2 border-amber-500/40 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500 text-white shadow-2xs">
                  <Upload className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Restore Database
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30">
                1-Click Import
              </span>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-300 mb-4 leading-relaxed">
              Restore an existing <code>.db</code> snapshot or <code>.json</code> archive. Validates schema integrity and saves a rollback safety snapshot automatically.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handlePickAndValidateBackup}
            disabled={isValidating || isRestoring}
            className="w-full flex items-center justify-center gap-2 text-xs shadow-xs cursor-pointer bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isValidating ? "Validating Schema..." : "Select Backup to Restore"}</span>
          </Button>
        </div>

        {/* Card 2: SQLite Database Snapshot */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                <Download className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Export SQLite Snapshot
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
              Creates a clean, vacuumed, crash-safe <code>.db</code> snapshot file while the app continues running. Perfect for cold storage and moving between PCs.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleExportDb}
            disabled={exportingDb}
            className="w-full flex items-center justify-center gap-2 text-xs cursor-pointer border-stone-200 dark:border-stone-800"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exportingDb ? "Exporting..." : "Export .db Snapshot"}</span>
          </Button>
        </div>

        {/* Card 3: JSON Full Data Archive */}
        <div className="rounded-2xl p-5 bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-300">
                <FileCode className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                Export JSON Archive
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 leading-relaxed">
              Generates a human-readable <code>.json</code> archive containing your tasks, notes, DSA problems, goals, and technical library items.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleExportJson}
            disabled={exportingJson}
            className="w-full flex items-center justify-center gap-2 text-xs cursor-pointer border-stone-200 dark:border-stone-800"
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>{exportingJson ? "Exporting JSON..." : "Export Portable JSON"}</span>
          </Button>
        </div>
      </div>

      {/* Database Diagnostic & Table Row Counts */}
      <div className="rounded-2xl p-5 bg-white dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Active SQLite Database Health
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-500/30">
            WAL Active • Healthy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
            <span className="text-[10px] uppercase font-semibold text-stone-400">Database Size</span>
            <div className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
              {backupInfo ? formatBytes(backupInfo.file_size_bytes) : "Calculating..."}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
            <span className="text-[10px] uppercase font-semibold text-stone-400">Total Stored Records</span>
            <div className="text-lg font-bold font-mono text-stone-900 dark:text-stone-100 mt-0.5">
              {backupInfo?.total_records || 0} rows
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60">
            <span className="text-[10px] uppercase font-semibold text-stone-400">Last Modified</span>
            <div className="text-xs font-mono font-medium text-stone-700 dark:text-stone-300 mt-1 truncate">
              {backupInfo?.last_modified || "Unknown"}
            </div>
          </div>
        </div>

        {/* Database File Path */}
        <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-xs mb-4">
          <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-1">
            SQLite Database File Location
          </span>
          <code className="font-mono text-[11px] text-stone-700 dark:text-stone-300 break-all select-all">
            {backupInfo?.db_path || "Resolving..."}
          </code>
        </div>

        {/* Live Table Breakdown */}
        <div>
          <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-2">
            Record Counts by Module Table
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {backupInfo?.tables.map((t) => (
              <div
                key={t.name}
                className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/30 border border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between"
              >
                <span className="text-xs font-mono text-stone-600 dark:text-stone-400">
                  {t.name}
                </span>
                <span className="text-xs font-mono font-bold text-stone-900 dark:text-stone-100">
                  {t.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SCHEMA VALIDATION & CONFIRM RESTORE MODAL                       */}
      {/* ============================================================== */}
      {validationResult && validationResult.is_valid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden p-6 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/80 dark:border-stone-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Validate & Confirm Database Restore
                  </h3>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Schema Verified • Integrity Check Passed
                  </span>
                </div>
              </div>
              <button
                onClick={() => setValidationResult(null)}
                className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Source Backup Overview */}
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/50 border border-stone-200/70 dark:border-stone-800/70 text-xs mb-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Source Backup File:</span>
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200 truncate max-w-[240px]">
                  {validationResult.file_name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Backup Format:</span>
                <span className="font-mono font-semibold text-stone-800 dark:text-stone-200 uppercase">
                  {validationResult.file_type === "sqlite" ? "SQLite WAL Snapshot" : "JSON Archive"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">File Size:</span>
                <span className="font-mono text-stone-800 dark:text-stone-200">
                  {formatBytes(validationResult.file_size_bytes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Total Records to Restore:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {validationResult.total_records} rows
                </span>
              </div>
            </div>

            {/* Table Breakdown in Backup */}
            <div className="mb-4">
              <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 block mb-1.5">
                Records Detected Across Tables:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1">
                {validationResult.table_counts.map((t) => (
                  <div
                    key={t.name}
                    className="px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 text-[11px] flex items-center justify-between font-mono"
                  >
                    <span className="text-stone-500">{t.name}:</span>
                    <span className="font-bold text-stone-800 dark:text-stone-200">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety Rollback Notice */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-900 dark:text-blue-200 text-[11px] mb-5 leading-relaxed">
              🛡️ <strong>Safety Guarantee:</strong> An automatic pre-restore backup snapshot of your current database will be saved to your app directory before restoration begins.
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setValidationResult(null)}
                disabled={isRestoring}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer shadow-xs"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                    <span>Restoring Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>Confirm & Restore Database</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
