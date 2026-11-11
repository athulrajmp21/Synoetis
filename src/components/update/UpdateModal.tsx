import React from "react";
import { Download, Sparkles, X, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";
import { useUpdateStore } from "@/stores/useUpdateStore";
import { Button } from "@/components/ui/Button";

export const UpdateModal: React.FC = () => {
  const {
    isModalOpen,
    setModalOpen,
    status,
    updateInfo,
    downloadProgress,
    downloadedBytes,
    totalBytes,
    errorMessage,
    downloadAndInstall,
  } = useUpdateStore();

  if (!isModalOpen || !updateInfo) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const isDownloading = status === "downloading";
  const isReady = status === "ready";
  const isError = status === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="w-full max-w-lg bg-[#FAF8F5] dark:bg-[#121110] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                  Update Available
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium">
                  v{updateInfo.version}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                Current version: v{updateInfo.currentVersion}
              </p>
            </div>
          </div>

          {!isDownloading && !isReady && (
            <button
              onClick={() => setModalOpen(false)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          {/* Release Notes */}
          {updateInfo.body ? (
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-stone-700 dark:text-stone-300">
                What's New in v{updateInfo.version}:
              </span>
              <div className="max-h-48 overflow-y-auto text-xs text-stone-600 dark:text-stone-400 bg-white/70 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200/70 dark:border-stone-800/70 whitespace-pre-line font-sans leading-relaxed">
                {updateInfo.body}
              </div>
            </div>
          ) : (
            <div className="text-xs text-stone-600 dark:text-stone-400 bg-white/70 dark:bg-stone-900/60 p-3 rounded-xl border border-stone-200/70 dark:border-stone-800/70">
              A new update of Synoetis with performance improvements and bug fixes is ready to download and install.
            </div>
          )}

          {/* Download Progress Bar */}
          {isDownloading && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-stone-600 dark:text-stone-300 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                  Downloading update package...
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {downloadProgress}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-200 rounded-full"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              {totalBytes > 0 && (
                <div className="text-[10px] text-stone-400 font-mono text-right">
                  {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
                </div>
              )}
            </div>
          )}

          {/* Ready & Restarting State */}
          {isReady && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Update downloaded successfully. Restarting Synoetis now...</span>
            </div>
          )}

          {/* Error State */}
          {isError && errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div className="flex-1 break-words">
                <strong className="block">Failed to update:</strong>
                {errorMessage}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-stone-100/60 dark:bg-[#0E0D0C] border-t border-stone-200 dark:border-stone-800 flex items-center justify-end gap-2.5">
          {!isDownloading && !isReady && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              className="text-xs"
            >
              Later
            </Button>
          )}

          <Button
            size="sm"
            onClick={downloadAndInstall}
            disabled={isDownloading || isReady}
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1.5 shadow-sm"
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Downloading ({downloadProgress}%)
              </>
            ) : isReady ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Restarting...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Download and Install
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
