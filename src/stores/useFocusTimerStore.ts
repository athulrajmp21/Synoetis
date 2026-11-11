import { create } from "zustand";
import { focusService, isTauriEnvironment } from "@/services/api";
import { listen } from "@tauri-apps/api/event";

export type FocusMode = "pomodoro" | "deepwork" | "shortbreak";

interface FocusTimerState {
  mode: FocusMode;
  duration: number; // total seconds
  timeLeft: number; // seconds remaining
  targetEndTime: number | null; // epoch ms
  isRunning: boolean;
  isModalOpen: boolean;
  completedSessionsToday: number;

  setMode: (mode: FocusMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  tick: () => void;
  setModalOpen: (open: boolean) => void;
  initSync: () => Promise<void>;
}

const MODE_DURATIONS: Record<FocusMode, number> = {
  pomodoro: 25 * 60,
  deepwork: 50 * 60,
  shortbreak: 5 * 60,
};

export const useFocusTimerStore = create<FocusTimerState>((set, get) => ({
  mode: "pomodoro",
  duration: MODE_DURATIONS.pomodoro,
  timeLeft: MODE_DURATIONS.pomodoro,
  targetEndTime: null,
  isRunning: false,
  isModalOpen: false,
  completedSessionsToday: 0,

  setMode: (mode: FocusMode) => {
    const dur = MODE_DURATIONS[mode];
    focusService.resetBackgroundTimer();
    set({
      mode,
      duration: dur,
      timeLeft: dur,
      targetEndTime: null,
      isRunning: false,
    });
  },

  startTimer: () => {
    const { timeLeft, mode } = get();
    const targetEndTime = Date.now() + timeLeft * 1000;
    focusService.startBackgroundTimer(timeLeft, mode);
    set({ isRunning: true, targetEndTime });
  },

  pauseTimer: () => {
    focusService.pauseBackgroundTimer();
    set({ isRunning: false, targetEndTime: null });
  },

  resetTimer: () => {
    const { duration } = get();
    focusService.resetBackgroundTimer();
    set({ timeLeft: duration, isRunning: false, targetEndTime: null });
  },

  setModalOpen: (open: boolean) => set({ isModalOpen: open }),

  tick: () => {
    const { isRunning, targetEndTime, mode, duration, completedSessionsToday } = get();
    if (!isRunning || !targetEndTime) return;

    const remaining = Math.max(0, Math.ceil((targetEndTime - Date.now()) / 1000));

    if (remaining <= 0) {
      // Completed session!
      const minutes = Math.round(duration / 60);
      if (mode !== "shortbreak") {
        focusService.logStudySession(minutes, `${mode === "deepwork" ? "Deep Work" : "Pomodoro"} session`);
        set({
          timeLeft: 0,
          isRunning: false,
          targetEndTime: null,
          completedSessionsToday: completedSessionsToday + 1,
        });
      } else {
        set({
          timeLeft: 0,
          isRunning: false,
          targetEndTime: null,
        });
      }

      // Audio notification chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.8);
      } catch {
        // Fallback
      }
    } else {
      set({ timeLeft: remaining });
    }
  },

  initSync: async () => {
    // Sync with backend if a timer is running in Rust
    try {
      const bg = await focusService.getBackgroundTimer();
      if (bg && bg.is_running && bg.seconds_remaining > 0) {
        set({
          mode: bg.mode as FocusMode,
          duration: bg.total_seconds,
          timeLeft: bg.seconds_remaining,
          targetEndTime: bg.target_end_timestamp_ms,
          isRunning: true,
        });
      }
    } catch {
      // ignore
    }
  },
}));

// Set up event listeners once if in Tauri environment
if (isTauriEnvironment()) {
  listen("focus-timer-completed", (event) => {
    const store = useFocusTimerStore.getState();
    const mode = event.payload as string;
    store.resetTimer();
    if (mode !== "shortbreak") {
      useFocusTimerStore.setState((prev) => ({
        completedSessionsToday: prev.completedSessionsToday + 1,
      }));
    }
  }).catch(console.error);

  listen("start-quick-timer", (event) => {
    const store = useFocusTimerStore.getState();
    const mode = (event.payload as FocusMode) || "pomodoro";
    store.setMode(mode);
    store.startTimer();
  }).catch(console.error);
}
