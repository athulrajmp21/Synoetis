import { create } from "zustand";
import { check, Update } from "@tauri-apps/plugin-updater";

export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "up-to-date"
  | "error";

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

interface UpdateStoreState {
  status: UpdateStatus;
  updateInfo: UpdateInfo | null;
  downloadProgress: number; // 0 to 100
  downloadedBytes: number;
  totalBytes: number;
  errorMessage: string | null;
  isModalOpen: boolean;
  activeUpdateHandle: Update | null;

  checkForUpdates: (silent?: boolean) => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  setModalOpen: (open: boolean) => void;
  reset: () => void;
}

const isTauriEnvironment = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  status: "idle",
  updateInfo: null,
  downloadProgress: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  errorMessage: null,
  isModalOpen: false,
  activeUpdateHandle: null,

  setModalOpen: (open) => set({ isModalOpen: open }),

  reset: () =>
    set({
      status: "idle",
      updateInfo: null,
      downloadProgress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      errorMessage: null,
      activeUpdateHandle: null,
    }),

  checkForUpdates: async (silent = false) => {
    if (!isTauriEnvironment()) {
      if (!silent) {
        set({
          status: "up-to-date",
          updateInfo: null,
          errorMessage: null,
        });
        setTimeout(() => {
          if (get().status === "up-to-date") set({ status: "idle" });
        }, 4000);
      }
      return;
    }

    set({ status: "checking", errorMessage: null });
    try {
      const update = await check();
      if (update) {
        set({
          status: "available",
          activeUpdateHandle: update,
          updateInfo: {
            version: update.version,
            currentVersion: update.currentVersion,
            date: update.date,
            body: update.body,
          },
          // Auto-prompt user visually if an update is found
          isModalOpen: true,
        });
      } else {
        set({
          status: "up-to-date",
          activeUpdateHandle: null,
          updateInfo: null,
        });
        setTimeout(() => {
          if (get().status === "up-to-date") set({ status: "idle" });
        }, 4000);
      }
    } catch (err: unknown) {
      console.warn("Failed to check for updates:", err);
      const msg = err instanceof Error ? err.message : String(err);
      set({
        status: silent ? "idle" : "error",
        errorMessage: msg,
      });
      if (!silent) {
        setTimeout(() => {
          if (get().status === "error") set({ status: "idle", errorMessage: null });
        }, 5000);
      }
    }
  },

  downloadAndInstall: async () => {
    const { activeUpdateHandle } = get();
    if (!activeUpdateHandle) return;

    set({
      status: "downloading",
      downloadProgress: 0,
      downloadedBytes: 0,
      totalBytes: 0,
      errorMessage: null,
      isModalOpen: true,
    });

    try {
      let downloaded = 0;
      let total = 0;

      await activeUpdateHandle.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength || 0;
            set({ totalBytes: total });
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            set({
              downloadedBytes: downloaded,
              downloadProgress: total > 0 ? Math.min(100, Math.round((downloaded / total) * 100)) : 50,
            });
            break;
          case "Finished":
            set({ downloadProgress: 100, status: "ready" });
            break;
        }
      });
    } catch (err: unknown) {
      console.error("Failed to download/install update:", err);
      const msg = err instanceof Error ? err.message : String(err);
      set({
        status: "error",
        errorMessage: msg,
      });
    }
  },
}));
