export type DashboardPreset =
  | "all"
  | "dsa"
  | "engineering"
  | "academic"
  | "minimalist"
  | "custom";

export interface DashboardMetricsConfig {
  pending_tasks: boolean;
  habits_streak: boolean;
  dsa_solved: boolean;
  current_semester: boolean;
  study_hours: boolean;
  active_projects: boolean;
}

export interface DashboardWidgetsConfig {
  priority_tasks: boolean;
  focus_timer: boolean;
  daily_habits: boolean;
  scratchpad: boolean;
  academic_snapshot: boolean;
  active_projects: boolean;
  dsa_snapshot: boolean;
  discipline_heatmap: boolean;
}

export interface DashboardConfig {
  preset: DashboardPreset;
  focus_tagline: string;
  metrics: DashboardMetricsConfig;
  widgets: DashboardWidgetsConfig;
}

export const DEFAULT_DASHBOARD_CONFIG: DashboardConfig = {
  preset: "all",
  focus_tagline: "Daily focus, pending priorities, and progress overview.",
  metrics: {
    pending_tasks: true,
    habits_streak: true,
    dsa_solved: true,
    current_semester: true,
    study_hours: false,
    active_projects: false,
  },
  widgets: {
    discipline_heatmap: true,
    priority_tasks: true,
    focus_timer: true,
    daily_habits: true,
    scratchpad: true,
    academic_snapshot: true,
    active_projects: true,
    dsa_snapshot: false,
  },
};

export const PRESET_CONFIGS: Record<Exclude<DashboardPreset, "custom">, DashboardConfig> = {
  all: {
    preset: "all",
    focus_tagline: "Daily focus, pending priorities, and progress overview.",
    metrics: {
      pending_tasks: true,
      habits_streak: true,
      dsa_solved: true,
      current_semester: true,
      study_hours: false,
      active_projects: false,
    },
    widgets: {
      discipline_heatmap: true,
      priority_tasks: true,
      focus_timer: true,
      daily_habits: true,
      scratchpad: true,
      academic_snapshot: true,
      active_projects: true,
      dsa_snapshot: false,
    },
  },
  dsa: {
    preset: "dsa",
    focus_tagline: "DSA grind, problem mastery & interview preparation.",
    metrics: {
      dsa_solved: true,
      pending_tasks: true,
      study_hours: true,
      habits_streak: false,
      current_semester: false,
      active_projects: false,
    },
    widgets: {
      discipline_heatmap: true,
      focus_timer: true,
      priority_tasks: true,
      dsa_snapshot: true,
      scratchpad: true,
      daily_habits: false,
      academic_snapshot: false,
      active_projects: false,
    },
  },
  engineering: {
    preset: "engineering",
    focus_tagline: "Shipping full-stack software, architecture & engineering projects.",
    metrics: {
      active_projects: true,
      pending_tasks: true,
      study_hours: true,
      dsa_solved: false,
      habits_streak: false,
      current_semester: false,
    },
    widgets: {
      discipline_heatmap: true,
      active_projects: true,
      priority_tasks: true,
      focus_timer: true,
      scratchpad: true,
      daily_habits: false,
      academic_snapshot: false,
      dsa_snapshot: false,
    },
  },
  academic: {
    preset: "academic",
    focus_tagline: "University coursework, syllabus mastery, exams & GPA target.",
    metrics: {
      current_semester: true,
      study_hours: true,
      pending_tasks: true,
      habits_streak: true,
      dsa_solved: false,
      active_projects: false,
    },
    widgets: {
      discipline_heatmap: true,
      academic_snapshot: true,
      priority_tasks: true,
      focus_timer: true,
      daily_habits: true,
      scratchpad: true,
      active_projects: false,
      dsa_snapshot: false,
    },
  },
  minimalist: {
    preset: "minimalist",
    focus_tagline: "Zero noise, pure flow state and top priority execution.",
    metrics: {
      pending_tasks: true,
      study_hours: true,
      habits_streak: false,
      dsa_solved: false,
      current_semester: false,
      active_projects: false,
    },
    widgets: {
      discipline_heatmap: false,
      focus_timer: true,
      priority_tasks: true,
      daily_habits: false,
      scratchpad: false,
      academic_snapshot: false,
      active_projects: false,
      dsa_snapshot: false,
    },
  },
};
