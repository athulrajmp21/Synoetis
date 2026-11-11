import { invoke } from "@tauri-apps/api/core";
import { SystemInfo, DashboardStats } from "@/types/system";
import { AppSetting } from "@/types/settings";
import {
  Task,
  CreateTaskInput,
  HabitItem,
  CreateHabitInput,
  NoteSummary,
  NoteDetail,
  DsaTopicItem,
  DsaProblemItem,
  AddDsaProblemInput,
  SemesterItem,
  CourseItem,
  AssessmentItem,
  ProjectItem,
  CreateProjectInput,
  CompanyItem,
  ApplicationItem,
  CreateApplicationInput,
  InterviewItem,
  CreateInterviewInput,
  GoalItem,
  MilestoneItem,
  CreateGoalInput,
  UpdateGoalInput,
  CreateMilestoneInput,
  ResourceItem,
  CreateResourceInput,
  UpdateResourceInput,
  SelectedFileInfo,
  ResourceContentResponse,
  BackupInfo,
  BackupValidationResult,
  RestoreResult,
  AnalyticsOverview,
  OmniSearchResultItem,
  OmniSearchResponse,
  SnippetItem,
  CreateSnippetInput,
  UpdateSnippetInput,
  ClassScheduleItem,
  CreateClassScheduleInput,
  GpaSimulationInput,
  GpaSimulationResult,
  SrsItem,
  SrsOverview,
  SubmitSrsReviewInput,
  NoteExportResult,
  NoteImportResult,
} from "@/types/models";

export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export const systemService = {
  async getSystemInfo(): Promise<SystemInfo> {
    if (!isTauriEnvironment()) {
      return {
        app_version: "1.0.1",
        os: "Windows",
        db_path: "Local SQLite (synoetis.db)",
        total_tables: 20,
      };
    }
    try {
      return await invoke<SystemInfo>("get_system_info");
    } catch {
      return {
        app_version: "1.0.1",
        os: "Windows",
        db_path: "Local SQLite (synoetis.db)",
        total_tables: 20,
      };
    }
  },

  async getAutostartEnabled(): Promise<boolean> {
    if (!isTauriEnvironment()) {
      return localStorage.getItem("lifeos_autostart_enabled") === "true";
    }
    try {
      return await invoke<boolean>("get_autostart_enabled");
    } catch {
      return false;
    }
  },

  async setAutostartEnabled(enabled: boolean): Promise<void> {
    localStorage.setItem("lifeos_autostart_enabled", enabled ? "true" : "false");
    if (!isTauriEnvironment()) return;
    try {
      await invoke("set_autostart_enabled", { enabled });
    } catch (e) {
      console.error("Failed to update autostart setting:", e);
      throw e;
    }
  },

  async setTrayVisible(visible: boolean): Promise<void> {
    if (!isTauriEnvironment()) return;
    try {
      await invoke("set_tray_visible", { visible });
    } catch (e) {
      console.error("Failed to update tray visibility:", e);
    }
  },

  async exitApp(): Promise<void> {
    if (!isTauriEnvironment()) return;
    try {
      await invoke("exit_app");
    } catch (e) {
      console.error("Failed to exit app:", e);
    }
  },
};

export const settingsService = {
  async getSetting(key: string): Promise<string | null> {
    if (!isTauriEnvironment()) {
      return localStorage.getItem(`lifeos_setting_${key}`);
    }
    try {
      return await invoke<string | null>("get_setting", { key });
    } catch {
      return localStorage.getItem(`lifeos_setting_${key}`);
    }
  },

  async setSetting(key: string, value: string): Promise<void> {
    localStorage.setItem(`lifeos_setting_${key}`, value);
    if (!isTauriEnvironment()) return;
    try {
      await invoke("set_setting", { key, value });
    } catch (e) {
      console.warn("Failed to set setting:", e);
    }
  },

  async getAllSettings(): Promise<AppSetting[]> {
    if (!isTauriEnvironment()) {
      return [
        { key: "theme", value: "dark", updated_at: new Date().toISOString() },
        { key: "sidebar_collapsed", value: "false", updated_at: new Date().toISOString() },
      ];
    }
    try {
      return await invoke<AppSetting[]>("get_all_settings");
    } catch {
      return [];
    }
  },
};

export const dashboardService = {
  async getDashboardStats(): Promise<DashboardStats> {
    if (!isTauriEnvironment()) {
      return {
        pending_tasks_count: 0,
        active_projects_count: 0,
        dsa_solved_count: 0,
        current_semester: "Not Set",
        weekly_study_hours: 0,
        active_goals_count: 0,
        upcoming_assessments_count: 0,
      };
    }
    try {
      return await invoke<DashboardStats>("get_dashboard_stats");
    } catch {
      return {
        pending_tasks_count: 0,
        active_projects_count: 0,
        dsa_solved_count: 0,
        current_semester: "Not Set",
        weekly_study_hours: 0,
        active_goals_count: 0,
        upcoming_assessments_count: 0,
      };
    }
  },
};

export const taskService = {
  async getTasks(): Promise<Task[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_tasks");
      return saved ? JSON.parse(saved) : [];
    }
    try {
      return await invoke<Task[]>("get_tasks");
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
      return [];
    }
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    if (!isTauriEnvironment()) {
      const current = await this.getTasks();
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description || null,
        priority: (input.priority as any) || "medium",
        status: "todo",
        due_date: input.due_date || null,
        category: input.category || "general",
        is_recurring: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem("lifeos_tasks", JSON.stringify([newTask, ...current]));
      return newTask;
    }
    return await invoke<Task>("create_task", { input });
  },

  async updateTaskStatus(id: string, status: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getTasks();
      const updated = current.map(t => t.id === id ? { ...t, status: status as any } : t);
      localStorage.setItem("lifeos_tasks", JSON.stringify(updated));
      return;
    }
    await invoke("update_task_status", { id, status });
  },

  async deleteTask(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getTasks();
      const updated = current.filter(t => t.id !== id);
      localStorage.setItem("lifeos_tasks", JSON.stringify(updated));
      return;
    }
    await invoke("delete_task", { id });
  },
};

export const habitService = {
  async getHabits(): Promise<HabitItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_habits");
      return saved ? JSON.parse(saved) : [];
    }
    try {
      return await invoke<HabitItem[]>("get_habits");
    } catch (e) {
      console.error("Failed to fetch habits:", e);
      return [];
    }
  },

  async createHabit(input: CreateHabitInput): Promise<HabitItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getHabits();
      const newHabit: HabitItem = {
        id: crypto.randomUUID(),
        title: input.title,
        category: input.category || "productivity",
        frequency: "daily",
        streak: 0,
        is_completed_today: false,
      };
      localStorage.setItem("lifeos_habits", JSON.stringify([...current, newHabit]));
      return newHabit;
    }
    return await invoke<HabitItem>("create_habit", { input });
  },

  async toggleHabitToday(habitId: string): Promise<boolean> {
    if (!isTauriEnvironment()) {
      const current = await this.getHabits();
      let state = false;
      const updated = current.map(h => {
        if (h.id === habitId) {
          state = !h.is_completed_today;
          return {
            ...h,
            is_completed_today: state,
            streak: state ? h.streak + 1 : Math.max(0, h.streak - 1),
          };
        }
        return h;
      });
      localStorage.setItem("lifeos_habits", JSON.stringify(updated));
      return state;
    }
    return await invoke<boolean>("toggle_habit_today", { habitId });
  },

  async deleteHabit(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getHabits();
      localStorage.setItem("lifeos_habits", JSON.stringify(current.filter(h => h.id !== id)));
      return;
    }
    await invoke("delete_habit", { id });
  },
};

export const notesService = {
  async getNotes(): Promise<NoteSummary[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_notes");
      return saved ? JSON.parse(saved) : [];
    }
    try {
      return await invoke<NoteSummary[]>("get_notes");
    } catch (e) {
      console.error("Failed to get notes:", e);
      return [];
    }
  },

  async getNoteById(id: string): Promise<NoteDetail | null> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem(`lifeos_note_${id}`);
      return saved ? JSON.parse(saved) : null;
    }
    try {
      return await invoke<NoteDetail | null>("get_note_by_id", { id });
    } catch (e) {
      console.error("Failed to get note:", e);
      return null;
    }
  },

  async saveNote(id: string | null, title: string, contentMarkdown: string): Promise<NoteDetail> {
    if (!isTauriEnvironment()) {
      const noteId = id || crypto.randomUUID();
      const detail: NoteDetail = {
        id: noteId,
        title,
        content_markdown: contentMarkdown,
        is_pinned: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem(`lifeos_note_${noteId}`, JSON.stringify(detail));
      const summaries = await this.getNotes();
      const filtered = summaries.filter(s => s.id !== noteId);
      const newSummary: NoteSummary = {
        id: noteId,
        title,
        is_pinned: false,
        updated_at: new Date().toISOString(),
        preview: contentMarkdown.slice(0, 100),
      };
      localStorage.setItem("lifeos_notes", JSON.stringify([newSummary, ...filtered]));
      return detail;
    }
    return await invoke<NoteDetail>("save_note", {
      input: {
        id,
        title,
        content_markdown: contentMarkdown,
      },
    });
  },

  async deleteNote(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const summaries = await this.getNotes();
      localStorage.setItem("lifeos_notes", JSON.stringify(summaries.filter(s => s.id !== id)));
      localStorage.removeItem(`lifeos_note_${id}`);
      return;
    }
    await invoke("delete_note", { id });
  },

  async exportNotesToFolder(targetDir?: string): Promise<NoteExportResult> {
    if (!isTauriEnvironment()) {
      return {
        target_directory: "C:\\Users\\Mock\\Documents\\NotesExport",
        exported_count: 5,
        message: "Browser Mock: Exported 5 notes to local folder.",
      };
    }
    return await invoke<NoteExportResult>("export_notes_to_folder", {
      targetDir: targetDir || null,
    });
  },

  async importMarkdownNotes(): Promise<NoteImportResult> {
    if (!isTauriEnvironment()) {
      return {
        imported_count: 2,
        imported_titles: ["Mock Note 1", "Mock Note 2"],
        message: "Browser Mock: Imported 2 markdown files.",
      };
    }
    return await invoke<NoteImportResult>("import_markdown_notes");
  },
};

export const dsaService = {
  async getDsaTopics(): Promise<DsaTopicItem[]> {
    if (!isTauriEnvironment()) {
      return [
        { id: "1", name: "Arrays & Hashing", slug: "arrays" },
        { id: "2", name: "Two Pointers", slug: "two-pointers" },
        { id: "3", name: "Dynamic Programming", slug: "dp" },
        { id: "4", name: "Trees & Graphs", slug: "trees-graphs" },
      ];
    }
    try {
      return await invoke<DsaTopicItem[]>("get_dsa_topics");
    } catch {
      return [];
    }
  },

  async getDsaProblems(): Promise<DsaProblemItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_dsa_problems");
      return saved ? JSON.parse(saved) : [];
    }
    try {
      return await invoke<DsaProblemItem[]>("get_dsa_problems");
    } catch (e) {
      console.error("Failed to fetch DSA problems:", e);
      return [];
    }
  },

  async addDsaProblem(input: AddDsaProblemInput): Promise<DsaProblemItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getDsaProblems();
      const newProblem: DsaProblemItem = {
        id: crypto.randomUUID(),
        topic_id: "custom",
        topic_name: input.topic_name,
        title: input.title,
        difficulty: input.difficulty as any,
        platform: input.platform || "LeetCode",
        url: input.url || null,
        independent_solve: false,
        confidence_score: 1,
      };
      localStorage.setItem("lifeos_dsa_problems", JSON.stringify([newProblem, ...current]));
      return newProblem;
    }
    return await invoke<DsaProblemItem>("add_dsa_problem", { input });
  },

  async updateDsaStatus(id: string, independentSolve: boolean, confidenceScore: number): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getDsaProblems();
      const updated = current.map(p => p.id === id ? {
        ...p,
        independent_solve: independentSolve,
        confidence_score: confidenceScore,
      } : p);
      localStorage.setItem("lifeos_dsa_problems", JSON.stringify(updated));
      return;
    }
    await invoke("update_dsa_status", {
      input: {
        id,
        independent_solve: independentSolve,
        confidence_score: confidenceScore,
      },
    });
  },

  async deleteDsaProblem(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getDsaProblems();
      localStorage.setItem("lifeos_dsa_problems", JSON.stringify(current.filter(p => p.id !== id)));
      return;
    }
    await invoke("delete_dsa_problem", { id });
  },
};

export const academicService = {
  async getSemesters(): Promise<SemesterItem[]> {
    if (!isTauriEnvironment()) {
      return Array.from({ length: 8 }, (_, i) => ({
        id: `sem-${i + 1}`,
        number: i + 1,
        name: `Semester ${i + 1}`,
        status: i === 0 ? "active" : "upcoming",
        target_gpa: null,
        actual_gpa: null,
      }));
    }
    try {
      return await invoke<SemesterItem[]>("get_semesters");
    } catch (e) {
      console.error("Failed to fetch semesters:", e);
      return [];
    }
  },

  async getCourses(semesterId?: string): Promise<CourseItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_courses");
      const list: CourseItem[] = saved ? JSON.parse(saved) : [];
      return semesterId ? list.filter(c => c.semester_id === semesterId) : list;
    }
    try {
      return await invoke<CourseItem[]>("get_courses", { semesterId: semesterId || null });
    } catch {
      return [];
    }
  },

  async createCourse(input: { semester_id: string; code: string; title: string; credits: number; instructor?: string; target_grade?: string }): Promise<CourseItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getCourses();
      const newCourse: CourseItem = {
        id: crypto.randomUUID(),
        semester_id: input.semester_id,
        code: input.code,
        title: input.title,
        credits: input.credits,
        instructor: input.instructor || null,
        target_grade: input.target_grade || null,
        final_grade: null,
        status: "enrolled",
      };
      localStorage.setItem("lifeos_courses", JSON.stringify([...current, newCourse]));
      return newCourse;
    }
    return await invoke<CourseItem>("create_course", { input });
  },

  async deleteCourse(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getCourses();
      localStorage.setItem("lifeos_courses", JSON.stringify(current.filter(c => c.id !== id)));
      return;
    }
    await invoke("delete_course", { id });
  },

  async getAssessments(courseId?: string): Promise<AssessmentItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_assessments");
      const list: AssessmentItem[] = saved ? JSON.parse(saved) : [];
      return courseId ? list.filter(a => a.course_id === courseId) : list;
    }
    try {
      return await invoke<AssessmentItem[]>("get_assessments", { courseId: courseId || null });
    } catch {
      return [];
    }
  },

  async createAssessment(input: { course_id: string; title: string; assessment_type: string; due_date?: string }): Promise<AssessmentItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getAssessments();
      const newAssessment: AssessmentItem = {
        id: crypto.randomUUID(),
        course_id: input.course_id,
        course_title: "Course",
        title: input.title,
        assessment_type: input.assessment_type,
        due_date: input.due_date || null,
        status: "pending",
      };
      localStorage.setItem("lifeos_assessments", JSON.stringify([...current, newAssessment]));
      return newAssessment;
    }
    return await invoke<AssessmentItem>("create_assessment", { input });
  },

  async toggleAssessmentStatus(id: string): Promise<string> {
    if (!isTauriEnvironment()) {
      const current = await this.getAssessments();
      let next = "pending";
      const updated = current.map(a => {
        if (a.id === id) {
          next = a.status === "pending" ? "submitted" : "pending";
          return { ...a, status: next };
        }
        return a;
      });
      localStorage.setItem("lifeos_assessments", JSON.stringify(updated));
      return next;
    }
    return await invoke<string>("toggle_assessment_status", { id });
  },

  async setActiveSemester(semesterNumber: number, targetGpa?: number, degree?: string): Promise<void> {
    if (!isTauriEnvironment()) {
      localStorage.setItem("lifeos_active_semester", semesterNumber.toString());
      if (degree) localStorage.setItem("lifeos_degree", degree);
      if (targetGpa) localStorage.setItem("lifeos_target_gpa", targetGpa.toString());
      return;
    }
    await invoke("set_active_semester", {
      semesterNumber,
      targetGpa: targetGpa || null,
      degree: degree || null,
    });
  },

  async getClassSchedules(semesterId?: string): Promise<ClassScheduleItem[]> {
    if (!isTauriEnvironment()) {
      return [
        {
          id: "sched-1",
          course_id: "c-1",
          course_code: "CS201",
          course_title: "Data Structures & Algorithms",
          day_of_week: 1, // Mon
          start_time: "09:30",
          end_time: "11:00",
          room: "LH-102",
          building: "Turing Block",
          class_type: "lecture",
        },
        {
          id: "sched-2",
          course_id: "c-2",
          course_code: "CS208",
          course_title: "Operating Systems",
          day_of_week: 3, // Wed
          start_time: "11:15",
          end_time: "12:45",
          room: "Lab-3",
          building: "Systems Hall",
          class_type: "lab",
        },
      ];
    }
    try {
      return await invoke<ClassScheduleItem[]>("get_class_schedules", {
        semesterId: semesterId || null,
      });
    } catch {
      return [];
    }
  },

  async createClassSchedule(input: CreateClassScheduleInput): Promise<ClassScheduleItem> {
    if (!isTauriEnvironment()) {
      return {
        id: `sched-${Date.now()}`,
        course_id: input.course_id,
        course_code: "COURSE",
        course_title: "Class",
        day_of_week: input.day_of_week,
        start_time: input.start_time,
        end_time: input.end_time,
        room: input.room || null,
        building: input.building || null,
        class_type: input.class_type || "lecture",
      };
    }
    return await invoke<ClassScheduleItem>("create_class_schedule", { input });
  },

  async deleteClassSchedule(id: string): Promise<boolean> {
    if (!isTauriEnvironment()) return true;
    return await invoke<boolean>("delete_class_schedule", { id });
  },

  async simulateGpa(input: GpaSimulationInput): Promise<GpaSimulationResult> {
    if (!isTauriEnvironment()) {
      const semCredits = input.simulated_courses.reduce((acc, c) => acc + c.credits, 0);
      return {
        semester_credits: semCredits,
        semester_gpa: 3.85,
        cumulative_credits: input.current_completed_credits + semCredits,
        projected_cumulative_gpa: 3.82,
        gpa_change: 0.05,
      };
    }
    return await invoke<GpaSimulationResult>("simulate_gpa", { input });
  },
};

export const projectService = {
  async getProjects(): Promise<ProjectItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_projects");
      return saved ? JSON.parse(saved) : [];
    }
    try {
      return await invoke<ProjectItem[]>("get_projects");
    } catch (e) {
      console.error("Failed to fetch projects:", e);
      return [];
    }
  },

  async createProject(input: CreateProjectInput): Promise<ProjectItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getProjects();
      const newProj: ProjectItem = {
        id: crypto.randomUUID(),
        title: input.title,
        description: input.description || null,
        tech_stack: input.tech_stack ? input.tech_stack.split(",").map((s) => s.trim()) : [],
        repo_url: input.repo_url || null,
        live_url: input.live_url || null,
        status: input.status || "active",
        priority: input.priority || "medium",
      };
      localStorage.setItem("lifeos_projects", JSON.stringify([newProj, ...current]));
      return newProj;
    }
    return await invoke<ProjectItem>("create_project", { input });
  },

  async updateProjectStatus(id: string, status: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getProjects();
      const updated = current.map((p) => (p.id === id ? { ...p, status } : p));
      localStorage.setItem("lifeos_projects", JSON.stringify(updated));
      return;
    }
    await invoke("update_project_status", { id, status });
  },

  async deleteProject(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getProjects();
      localStorage.setItem("lifeos_projects", JSON.stringify(current.filter((p) => p.id !== id)));
      return;
    }
    await invoke("delete_project", { id });
  },
};

export const focusService = {
  async logStudySession(durationMinutes: number, summary?: string, courseId?: string): Promise<void> {
    if (!isTauriEnvironment()) {
      console.log("Logged focus session:", durationMinutes, summary);
      return;
    }
    try {
      await invoke("log_study_session", {
        durationMinutes,
        summary: summary || null,
        courseId: courseId || null,
      });
    } catch (e) {
      console.error("Failed to log focus session:", e);
    }
  },

  async startBackgroundTimer(durationSeconds: number, mode: string): Promise<void> {
    if (!isTauriEnvironment()) return;
    try {
      await invoke("start_background_focus_timer", { durationSeconds, mode });
    } catch (e) {
      console.error("Failed to start background focus timer:", e);
    }
  },

  async pauseBackgroundTimer(): Promise<void> {
    if (!isTauriEnvironment()) return;
    try {
      await invoke("pause_background_focus_timer");
    } catch (e) {
      console.error("Failed to pause background focus timer:", e);
    }
  },

  async resetBackgroundTimer(): Promise<void> {
    if (!isTauriEnvironment()) return;
    try {
      await invoke("reset_background_focus_timer");
    } catch (e) {
      console.error("Failed to reset background focus timer:", e);
    }
  },

  async getBackgroundTimer(): Promise<{
    mode: string;
    total_seconds: number;
    seconds_remaining: number;
    is_running: boolean;
    target_end_timestamp_ms: number;
  } | null> {
    if (!isTauriEnvironment()) return null;
    try {
      return await invoke("get_background_focus_timer");
    } catch {
      return null;
    }
  },

  async sendDesktopNotification(title: string, body: string): Promise<void> {
    if (!isTauriEnvironment()) {
      alert(`${title}\n${body}`);
      return;
    }
    try {
      await invoke("send_desktop_notification", { title, body });
    } catch (e) {
      console.error("Failed to send desktop notification:", e);
    }
  },
};

export const careerService = {
  async getCompanies(): Promise<CompanyItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_companies");
      return saved ? JSON.parse(saved) : [];
    }
    try {
      return await invoke<CompanyItem[]>("get_companies");
    } catch (e) {
      console.error("Failed to fetch companies:", e);
      return [];
    }
  },

  async getApplications(): Promise<ApplicationItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_applications");
      return saved ? JSON.parse(saved) : [];
    }
    try {
      return await invoke<ApplicationItem[]>("get_applications");
    } catch (e) {
      console.error("Failed to fetch applications:", e);
      return [];
    }
  },

  async createApplication(input: CreateApplicationInput): Promise<ApplicationItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getApplications();
      const newApp: ApplicationItem = {
        id: crypto.randomUUID(),
        company_id: crypto.randomUUID(),
        company_name: input.company_name,
        company_tier: input.company_tier || "Tier 1",
        company_website: input.company_website || null,
        role: input.role,
        job_url: input.job_url || null,
        salary_range: input.salary_range || null,
        status: (input.status as any) || "applied",
        applied_date: input.applied_date || new Date().toISOString().split("T")[0],
        deadline: input.deadline || null,
        notes: input.notes || null,
        interviews_count: 0,
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem("lifeos_applications", JSON.stringify([newApp, ...current]));
      return newApp;
    }
    return await invoke<ApplicationItem>("create_application", { input });
  },

  async updateApplicationStatus(id: string, status: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getApplications();
      const updated = current.map((a) => (a.id === id ? { ...a, status: status as any, updated_at: new Date().toISOString() } : a));
      localStorage.setItem("lifeos_applications", JSON.stringify(updated));
      return;
    }
    await invoke("update_application_status", { id, status });
  },

  async deleteApplication(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getApplications();
      localStorage.setItem("lifeos_applications", JSON.stringify(current.filter((a) => a.id !== id)));
      return;
    }
    await invoke("delete_application", { id });
  },

  async getInterviews(applicationId?: string): Promise<InterviewItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_interviews");
      const list: InterviewItem[] = saved ? JSON.parse(saved) : [];
      return applicationId ? list.filter((i) => i.application_id === applicationId) : list;
    }
    try {
      return await invoke<InterviewItem[]>("get_interviews", { applicationId: applicationId || null });
    } catch (e) {
      console.error("Failed to fetch interviews:", e);
      return [];
    }
  },

  async createInterview(input: CreateInterviewInput): Promise<InterviewItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getInterviews();
      const newInterview: InterviewItem = {
        id: crypto.randomUUID(),
        application_id: input.application_id,
        round_name: input.round_name,
        interview_date: input.interview_date || new Date().toISOString().split("T")[0],
        interviewer_info: input.interviewer_info || null,
        questions_asked: input.questions_asked || null,
        notes: input.notes || null,
        result: (input.result as any) || "pending",
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("lifeos_interviews", JSON.stringify([newInterview, ...current]));
      return newInterview;
    }
    return await invoke<InterviewItem>("create_interview", { input });
  },

  async deleteInterview(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getInterviews();
      localStorage.setItem("lifeos_interviews", JSON.stringify(current.filter((i) => i.id !== id)));
      return;
    }
    await invoke("delete_interview", { id });
  },
};

export const goalService = {
  async getGoals(timeframe?: string, category?: string): Promise<GoalItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_goals");
      let list: GoalItem[] = saved ? JSON.parse(saved) : [];
      if (list.length === 0) {
        list = [
          {
            id: "goal-1",
            title: "Master Systems Programming in Rust",
            description: "Deep dive into Tokio async concurrency, memory safety, and high-throughput networking.",
            category: "technical",
            timeframe: "quarterly",
            target_date: "2026-12-31",
            progress: 67,
            status: "in_progress",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            milestones_count: 3,
            completed_milestones_count: 2,
          },
          {
            id: "goal-2",
            title: "Crack Tier 1 Software Engineer Placements",
            description: "Complete Blind 75 and Striver SDE sheet with mock system design interviews.",
            category: "career",
            timeframe: "quarterly",
            target_date: "2026-11-30",
            progress: 50,
            status: "in_progress",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            milestones_count: 4,
            completed_milestones_count: 2,
          },
          {
            id: "goal-3",
            title: "Maintain 9.0+ Cumulative Semester GPA",
            description: "Top grades in Operating Systems, Database Internals, and Computer Networks.",
            category: "academic",
            timeframe: "short_term",
            target_date: "2026-12-15",
            progress: 75,
            status: "in_progress",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            milestones_count: 4,
            completed_milestones_count: 3,
          },
        ];
        localStorage.setItem("lifeos_goals", JSON.stringify(list));
      }
      if (timeframe && timeframe !== "all") {
        list = list.filter((g) => g.timeframe === timeframe);
      }
      if (category && category !== "all") {
        list = list.filter((g) => g.category === category);
      }
      return list;
    }
    return await invoke<GoalItem[]>("get_goals", {
      timeframe: timeframe || null,
      category: category || null,
    });
  },

  async createGoal(input: CreateGoalInput): Promise<GoalItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getGoals();
      const goalId = `goal-${Date.now()}`;
      const newGoal: GoalItem = {
        id: goalId,
        title: input.title,
        description: input.description || null,
        category: input.category,
        timeframe: input.timeframe,
        target_date: input.target_date || null,
        progress: 0,
        status: "in_progress",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        milestones_count: input.initial_milestones?.length || 0,
        completed_milestones_count: 0,
      };

      if (input.initial_milestones && input.initial_milestones.length > 0) {
        const existingMilestones = await this.getMilestones();
        const createdMs: MilestoneItem[] = input.initial_milestones.map((title) => ({
          id: `ms-${Date.now()}-${Math.random()}`,
          goal_id: goalId,
          title,
          is_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        localStorage.setItem("lifeos_milestones", JSON.stringify([...createdMs, ...existingMilestones]));
      }

      localStorage.setItem("lifeos_goals", JSON.stringify([newGoal, ...current]));
      return newGoal;
    }
    return await invoke<GoalItem>("create_goal", { input });
  },

  async updateGoal(id: string, input: UpdateGoalInput): Promise<GoalItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getGoals();
      let updated: GoalItem | null = null;
      const newList = current.map((g) => {
        if (g.id === id) {
          updated = {
            ...g,
            ...input,
            updated_at: new Date().toISOString(),
          };
          return updated;
        }
        return g;
      });
      localStorage.setItem("lifeos_goals", JSON.stringify(newList));
      return updated!;
    }
    return await invoke<GoalItem>("update_goal", { id, input });
  },

  async updateGoalProgress(id: string, progress: number): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getGoals();
      const clamped = Math.max(0, Math.min(100, progress));
      const status = clamped >= 100 ? "completed" : "in_progress";
      const updated = current.map((g) => (g.id === id ? { ...g, progress: clamped, status, updated_at: new Date().toISOString() } : g));
      localStorage.setItem("lifeos_goals", JSON.stringify(updated));
      return;
    }
    await invoke("update_goal_progress", { id, progress });
  },

  async updateGoalStatus(id: string, status: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getGoals();
      const progress = status === "completed" ? 100 : undefined;
      const updated = current.map((g) => (g.id === id ? {
        ...g,
        status,
        progress: progress !== undefined ? progress : g.progress,
        updated_at: new Date().toISOString()
      } : g));
      localStorage.setItem("lifeos_goals", JSON.stringify(updated));
      return;
    }
    await invoke("update_goal_status", { id, status });
  },

  async deleteGoal(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getGoals();
      localStorage.setItem("lifeos_goals", JSON.stringify(current.filter((g) => g.id !== id)));
      const ms = await this.getMilestones();
      localStorage.setItem("lifeos_milestones", JSON.stringify(ms.filter((m) => m.goal_id !== id)));
      return;
    }
    await invoke("delete_goal", { id });
  },

  async getMilestones(goalId?: string): Promise<MilestoneItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_milestones");
      let list: MilestoneItem[] = saved ? JSON.parse(saved) : [];
      if (list.length === 0) {
        list = [
          { id: "ms-1", goal_id: "goal-1", title: "Build multi-threaded event loop engine", is_completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "ms-2", goal_id: "goal-1", title: "Implement lock-free queue benchmarks", is_completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "ms-3", goal_id: "goal-1", title: "Publish open-source crate to crates.io", is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "ms-4", goal_id: "goal-2", title: "Solve 150+ LeetCode Medium/Hard", is_completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "ms-5", goal_id: "goal-2", title: "Master Dynamic Programming patterns", is_completed: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "ms-6", goal_id: "goal-2", title: "Pass 3 full mock interviews with feedback", is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: "ms-7", goal_id: "goal-2", title: "Apply to top 20 wishlist companies", is_completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ];
        localStorage.setItem("lifeos_milestones", JSON.stringify(list));
      }
      return goalId ? list.filter((m) => m.goal_id === goalId) : list;
    }
    return await invoke<MilestoneItem[]>("get_milestones", { goalId: goalId || null });
  },

  async createMilestone(input: CreateMilestoneInput): Promise<MilestoneItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getMilestones();
      const newMs: MilestoneItem = {
        id: `ms-${Date.now()}`,
        goal_id: input.goal_id || null,
        project_id: input.project_id || null,
        title: input.title,
        due_date: input.due_date || null,
        is_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem("lifeos_milestones", JSON.stringify([newMs, ...current]));
      return newMs;
    }
    return await invoke<MilestoneItem>("create_milestone", { input });
  },

  async toggleMilestone(id: string): Promise<boolean> {
    if (!isTauriEnvironment()) {
      const current = await this.getMilestones();
      let res = false;
      const updated = current.map((m) => {
        if (m.id === id) {
          res = !m.is_completed;
          return { ...m, is_completed: res, updated_at: new Date().toISOString() };
        }
        return m;
      });
      localStorage.setItem("lifeos_milestones", JSON.stringify(updated));
      return res;
    }
    return await invoke<boolean>("toggle_milestone", { id });
  },

  async deleteMilestone(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getMilestones();
      localStorage.setItem("lifeos_milestones", JSON.stringify(current.filter((m) => m.id !== id)));
      return;
    }
    await invoke("delete_milestone", { id });
  },
};

export const resourceService = {
  async getResources(status?: string, type?: string): Promise<ResourceItem[]> {
    if (!isTauriEnvironment()) {
      const saved = localStorage.getItem("lifeos_resources");
      let list: ResourceItem[] = saved ? JSON.parse(saved) : [];
      if (list.length === 0) {
        list = [
          {
            id: "res-1",
            title: "Designing Data-Intensive Applications",
            author: "Martin Kleppmann",
            resource_type: "book",
            url: "https://dataintensive.net",
            learning_status: "in_progress",
            rating: 5,
            notes: "Gold standard reference for distributed databases, consensus, and storage engines.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "res-2",
            title: "In Search of an Understandable Consensus Algorithm (Raft)",
            author: "Diego Ongaro & John Ousterhout (Stanford)",
            resource_type: "paper",
            url: "https://raft.github.io/raft.pdf",
            learning_status: "completed",
            rating: 5,
            notes: "Leader election, log replication, and safety invariants explained with clarity.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "res-3",
            title: "Tokio Async Runtime & Rust Concurrency Guide",
            author: "Tokio Project",
            resource_type: "documentation",
            url: "https://tokio.rs",
            learning_status: "in_progress",
            rating: 5,
            notes: "Cooperative task scheduling, non-blocking network streams, and channel primitives.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "res-4",
            title: "MIT 6.824: Distributed Systems Graduate Course",
            author: "Prof. Robert Morris (MIT)",
            resource_type: "course",
            url: "https://pdos.csail.mit.edu/6.824/",
            learning_status: "to_read",
            rating: 5,
            notes: "Includes rigorous labs on Raft, sharded key-value stores, and 2-phase commit.",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem("lifeos_resources", JSON.stringify(list));
      }
      if (status && status !== "all") {
        list = list.filter((r) => r.learning_status === status);
      }
      if (type && type !== "all") {
        list = list.filter((r) => r.resource_type === type);
      }
      return list;
    }
    return await invoke<ResourceItem[]>("get_resources", {
      learningStatus: status || null,
      resourceType: type || null,
    });
  },

  async createResource(input: CreateResourceInput): Promise<ResourceItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getResources();
      const newRes: ResourceItem = {
        id: `res-${Date.now()}`,
        title: input.title,
        resource_type: input.resource_type,
        url: input.url || null,
        author: input.author || null,
        learning_status: input.learning_status || "to_read",
        rating: input.rating || 0,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem("lifeos_resources", JSON.stringify([newRes, ...current]));
      return newRes;
    }
    return await invoke<ResourceItem>("create_resource", { input });
  },

  async updateResource(id: string, input: UpdateResourceInput): Promise<ResourceItem> {
    if (!isTauriEnvironment()) {
      const current = await this.getResources();
      let updated: ResourceItem | null = null;
      const list = current.map((r) => {
        if (r.id === id) {
          updated = { ...r, ...input, updated_at: new Date().toISOString() };
          return updated;
        }
        return r;
      });
      localStorage.setItem("lifeos_resources", JSON.stringify(list));
      return updated!;
    }
    return await invoke<ResourceItem>("update_resource", { id, input });
  },

  async updateResourceStatus(id: string, status: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getResources();
      const updated = current.map((r) => (r.id === id ? { ...r, learning_status: status, updated_at: new Date().toISOString() } : r));
      localStorage.setItem("lifeos_resources", JSON.stringify(updated));
      return;
    }
    await invoke("update_resource_status", { id, status });
  },

  async updateResourceRating(id: string, rating: number): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getResources();
      const updated = current.map((r) => (r.id === id ? { ...r, rating, updated_at: new Date().toISOString() } : r));
      localStorage.setItem("lifeos_resources", JSON.stringify(updated));
      return;
    }
    await invoke("update_resource_rating", { id, rating });
  },

  async deleteResource(id: string): Promise<void> {
    if (!isTauriEnvironment()) {
      const current = await this.getResources();
      localStorage.setItem("lifeos_resources", JSON.stringify(current.filter((r) => r.id !== id)));
      return;
    }
    await invoke("delete_resource", { id });
  },

  async pickLocalFiles(): Promise<SelectedFileInfo[]> {
    if (!isTauriEnvironment()) {
      return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.onchange = () => {
          if (!input.files || input.files.length === 0) {
            resolve([]);
            return;
          }
          const results: SelectedFileInfo[] = Array.from(input.files).map((f) => ({
            path: `C:\\Users\\Mock\\Documents\\${f.name}`,
            file_name: f.name,
            extension: f.name.split(".").pop()?.toLowerCase() || "",
            file_size_bytes: f.size,
          }));
          resolve(results);
        };
        input.click();
      });
    }
    return await invoke<SelectedFileInfo[]>("pick_local_files");
  },

  async createResourcesBatch(inputs: CreateResourceInput[]): Promise<ResourceItem[]> {
    if (!isTauriEnvironment()) {
      const current = await this.getResources();
      const newItems: ResourceItem[] = inputs.map((input, idx) => ({
        id: `res-${Date.now()}-${idx}`,
        title: input.title,
        resource_type: input.resource_type,
        url: input.url || null,
        author: input.author || null,
        learning_status: input.learning_status || "to_read",
        rating: input.rating || 0,
        notes: input.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      localStorage.setItem("lifeos_resources", JSON.stringify([...newItems, ...current]));
      return newItems;
    }
    return await invoke<ResourceItem[]>("create_resources_batch", { inputs });
  },

  async openResourceItem(target: string): Promise<void> {
    if (!isTauriEnvironment()) {
      window.open(target, "_blank");
      return;
    }
    try {
      await invoke("open_resource_item", { target });
    } catch (e) {
      console.warn("Direct command open failed, attempting window open:", e);
      window.open(target, "_blank");
    }
  },

  async revealInExplorer(path: string): Promise<void> {
    if (!isTauriEnvironment()) {
      alert(`Local file path: ${path}`);
      return;
    }
    await invoke("reveal_in_explorer", { path });
  },

  async loadResourceContent(path: string): Promise<ResourceContentResponse> {
    if (!isTauriEnvironment()) {
      // Mock for browser mode
      const ext = path.split(".").pop()?.toLowerCase() || "";
      const isPdf = ext === "pdf";
      const isText = ["md", "txt", "rs", "py", "ts", "cpp", "json"].includes(ext);
      return {
        file_name: path.split("\\").pop() || path.split("/").pop() || "Resource",
        extension: ext,
        file_size_bytes: 1024 * 45,
        is_pdf: isPdf,
        is_text: isText,
        is_image: ["png", "jpg", "jpeg", "webp"].includes(ext),
        text_content: isText ? `# Mock Content for ${path}\n\nThis is a browser simulation of embedded resource content.\nWhen running in the native Windows Life OS desktop app, full local file reading and PDF previewing is active!` : null,
        data_url: null,
      };
    }
    return await invoke<ResourceContentResponse>("load_resource_file_content", { path });
  },

  async saveResourceFileContent(path: string, content: string): Promise<void> {
    if (!isTauriEnvironment()) {
      console.log(`[Browser Mock] Saved ${content.length} bytes to ${path}`);
      return;
    }
    await invoke("save_resource_file_content", { path, content });
  },
};

export const backupService = {
  async getBackupInfo(): Promise<BackupInfo> {
    if (!isTauriEnvironment()) {
      return {
        db_path: "LocalStorage (Browser Mode)",
        file_size_bytes: 524288,
        last_modified: new Date().toISOString(),
        wal_mode: true,
        tables: [
          { name: "tasks", count: 12 },
          { name: "habits", count: 6 },
          { name: "notes", count: 8 },
          { name: "dsa_problems", count: 24 },
          { name: "courses", count: 5 },
          { name: "projects", count: 4 },
          { name: "goals", count: 3 },
          { name: "resources", count: 4 },
        ],
        total_records: 66,
      };
    }
    return await invoke<BackupInfo>("get_backup_info");
  },

  async exportDatabaseBackup(destinationFolder?: string): Promise<string> {
    if (!isTauriEnvironment()) {
      return "Browser environment: SQLite binary export unavailable in web simulation.";
    }
    return await invoke<string>("export_database_backup", { destinationFolder: destinationFolder || null });
  },

  async exportJsonArchive(destinationFolder?: string): Promise<string> {
    if (!isTauriEnvironment()) {
      const data = {
        tasks: localStorage.getItem("lifeos_tasks"),
        habits: localStorage.getItem("lifeos_habits"),
        notes: localStorage.getItem("lifeos_notes"),
        goals: localStorage.getItem("lifeos_goals"),
        resources: localStorage.getItem("lifeos_resources"),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LifeOS_Backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      return "JSON archive downloaded via browser";
    }
    return await invoke<string>("export_json_archive", { destinationFolder: destinationFolder || null });
  },

  async pickBackupFile(): Promise<string | null> {
    if (!isTauriEnvironment()) {
      return "C:\\Users\\Mock\\Downloads\\LifeOS_Backup_20261111_021500.db";
    }
    return await invoke<string | null>("pick_backup_file");
  },

  async validateBackupFile(path: string): Promise<BackupValidationResult> {
    if (!isTauriEnvironment()) {
      return {
        is_valid: true,
        file_name: path.split("\\").pop() || "backup.db",
        file_path: path,
        file_size_bytes: 524288,
        file_type: path.endsWith(".json") ? "json" : "sqlite",
        schema_version: 2,
        total_records: 64,
        table_counts: [
          { name: "tasks", count: 12 },
          { name: "notes", count: 8 },
          { name: "resources", count: 4 },
          { name: "dsa_problems", count: 24 },
          { name: "goals", count: 6 },
          { name: "habits", count: 10 },
        ],
        error_message: null,
      };
    }
    return await invoke<BackupValidationResult>("validate_backup_file", { path });
  },

  async restoreDatabaseFromBackup(path: string): Promise<RestoreResult> {
    if (!isTauriEnvironment()) {
      return {
        success: true,
        total_records_restored: 64,
        tables_restored: [
          { name: "tasks", count: 12 },
          { name: "notes", count: 8 },
          { name: "resources", count: 4 },
        ],
        message: "Successfully restored database in browser simulation mode.",
        safety_backup_path: "C:\\Users\\Mock\\AppData\\Roaming\\com.lifeos.desktop\\LifeOS_PreRestore_Safety.db",
      };
    }
    return await invoke<RestoreResult>("restore_database_from_backup", { path });
  },
};

export const analyticsService = {
  async getAnalyticsOverview(daysBack?: number): Promise<AnalyticsOverview> {
    if (!isTauriEnvironment()) {
      // Mock fallback
      const days = daysBack || 90;
      const heatmap = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const pts = Math.floor(Math.random() * 8);
        return {
          date: d.toISOString().split("T")[0],
          count: pts,
          level: pts === 0 ? 0 : pts < 3 ? 1 : pts < 6 ? 2 : 3,
          tasks_completed: Math.floor(pts / 2),
          habits_completed: pts > 0 ? 2 : 0,
          study_minutes: pts * 15,
          dsa_solved: pts > 4 ? 1 : 0,
        };
      });

      return {
        total_study_minutes: 1840,
        weekly_study_minutes: 420,
        total_tasks_completed: 48,
        total_habits_completed: 132,
        total_dsa_solved: 38,
        current_streak_days: 14,
        heatmap_days: heatmap,
        dsa_topics: [
          { topic_id: "t1", topic_name: "Dynamic Programming", solved: 14, total: 20, percentage: 70 },
          { topic_id: "t2", topic_name: "Graphs & Traversals", solved: 10, total: 18, percentage: 56 },
          { topic_id: "t3", topic_name: "Binary Trees & BST", solved: 12, total: 15, percentage: 80 },
          { topic_id: "t4", topic_name: "Arrays & Two Pointers", solved: 18, total: 20, percentage: 90 },
          { topic_id: "t5", topic_name: "System Design & Low Level", solved: 6, total: 12, percentage: 50 },
        ],
        weekly_velocity: [
          { day_name: "Mon", date: "2026-11-04", study_hours: 2.5, tasks_completed: 4, habits_completed: 3 },
          { day_name: "Tue", date: "2026-11-05", study_hours: 3.0, tasks_completed: 5, habits_completed: 4 },
          { day_name: "Wed", date: "2026-11-06", study_hours: 1.5, tasks_completed: 2, habits_completed: 2 },
          { day_name: "Thu", date: "2026-11-07", study_hours: 4.0, tasks_completed: 6, habits_completed: 4 },
          { day_name: "Fri", date: "2026-11-08", study_hours: 2.0, tasks_completed: 3, habits_completed: 3 },
          { day_name: "Sat", date: "2026-11-09", study_hours: 5.0, tasks_completed: 7, habits_completed: 4 },
          { day_name: "Sun", date: "2026-11-10", study_hours: 3.5, tasks_completed: 4, habits_completed: 4 },
        ],
      };
    }
    return await invoke<AnalyticsOverview>("get_analytics_overview", { daysBack: daysBack || null });
  },
};

export const searchService = {
  async globalOmnisearch(query: string, filterCategory?: string): Promise<OmniSearchResponse> {
    if (!isTauriEnvironment()) {
      // Browser Mock
      const q = query.toLowerCase().trim();
      const mockItems: OmniSearchResultItem[] = [
        {
          id: "res-1",
          category: "resource",
          title: "Designing Data-Intensive Applications",
          subtitle: "by Martin Kleppmann • Distributed Systems & Storage Engines",
          badge: "BOOK • IN PROGRESS",
          badge_color: "amber",
          url_or_path: "https://dataintensive.net",
          target_route: "/study?resourceId=res-1",
          is_local_file: false,
          match_preview: "Distributed transactions, consensus protocols, and replication models.",
        },
        {
          id: "res-2",
          category: "resource",
          title: "Operating Systems: Three Easy Pieces (OSTEP)",
          subtitle: "C:\\Users\\Best\\Documents\\OSTEP.pdf",
          badge: "PDF • LOCAL FILE",
          badge_color: "blue",
          url_or_path: "C:\\Users\\Best\\Documents\\OSTEP.pdf",
          target_route: "/study?resourceId=res-2",
          is_local_file: true,
          match_preview: "Virtualization, concurrency primitives, and file system mechanics.",
        },
        {
          id: "task-1",
          category: "task",
          title: "Implement distributed consensus raft tests",
          subtitle: "Due: Tomorrow • High Priority",
          badge: "HIGH • IN PROGRESS",
          badge_color: "amber",
          target_route: "/tasks",
          is_local_file: false,
        },
        {
          id: "note-1",
          category: "note",
          title: "Paging & Multi-Level Page Tables Architecture",
          subtitle: "Deep dive into TLB hit/miss latency and page faults.",
          badge: "PINNED NOTE",
          badge_color: "purple",
          target_route: "/study?noteId=note-1",
          is_local_file: false,
          match_preview: "Virtual memory mapping using 4-level page tables on x86_64.",
        },
        {
          id: "dsa-1",
          category: "dsa",
          title: "Course Schedule II (Topological Sort)",
          subtitle: "Topic: Graphs • LeetCode",
          badge: "MEDIUM DSA",
          badge_color: "amber",
          url_or_path: "https://leetcode.com/problems/course-schedule-ii/",
          target_route: "/dsa",
          is_local_file: false,
        },
        {
          id: "career-1",
          category: "career",
          title: "Google - Systems Engineer Intern",
          subtitle: "Interview Round • Tier 1",
          badge: "INTERVIEW",
          badge_color: "amber",
          target_route: "/career",
          is_local_file: false,
        },
        {
          id: "goal-1",
          category: "goal",
          title: "Master Systems Programming in Rust",
          subtitle: "Technical • Quarterly Sprint (Progress: 67%)",
          badge: "67% DONE",
          badge_color: "amber",
          target_route: "/goals",
          is_local_file: false,
        },
      ];

      const filtered = q
        ? mockItems.filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              (i.subtitle && i.subtitle.toLowerCase().includes(q)) ||
              (i.match_preview && i.match_preview.toLowerCase().includes(q))
          )
        : mockItems;

      return {
        query,
        total_count: filtered.length,
        execution_time_ms: 1,
        items: filtered,
      };
    }

    return await invoke<OmniSearchResponse>("global_omnisearch", {
      query,
      filterCategory: filterCategory || null,
    });
  },
};

// =============================================================================
// Developer Snippet Vault & CLI Cheat Sheets Service
// =============================================================================
export const snippetsService = {
  async getSnippets(
    category?: string,
    search?: string,
    favoritesOnly?: boolean
  ): Promise<SnippetItem[]> {
    if (!isTauriEnvironment()) {
      return [
        {
          id: "snip-git-1",
          title: "Undo last commit (keep changes staged)",
          description: "Rewinds HEAD by one commit while keeping changes staged in the index.",
          code: "git reset --soft HEAD~1",
          language: "bash",
          category: "git",
          tags: ["git", "undo", "commit", "workflow"],
          is_favorite: true,
          usage_count: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "snip-docker-1",
          title: "Purge unused Docker data",
          description: "Frees up disk space by removing stopped containers, unused networks, and dangling images.",
          code: "docker system prune -a --volumes -f",
          language: "bash",
          category: "docker",
          tags: ["docker", "clean", "disk", "prune"],
          is_favorite: true,
          usage_count: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "snip-linux-1",
          title: "Kill process holding a specific TCP port",
          description: "Finds and forcefully terminates the process bound to a specific port.",
          code: "lsof -ti:8080 | xargs kill -9",
          language: "bash",
          category: "linux",
          tags: ["linux", "port", "kill", "network"],
          is_favorite: true,
          usage_count: 15,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }

    return await invoke<SnippetItem[]>("get_snippets", {
      category: category || null,
      search: search || null,
      favoritesOnly: favoritesOnly || null,
    });
  },

  async createSnippet(input: CreateSnippetInput): Promise<SnippetItem> {
    if (!isTauriEnvironment()) {
      return {
        id: `snip-${Date.now()}`,
        title: input.title,
        description: input.description,
        code: input.code,
        language: input.language || "bash",
        category: input.category || "general",
        tags: input.tags ? input.tags.split(",").map((t) => t.trim()) : [],
        is_favorite: !!input.is_favorite,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return await invoke<SnippetItem>("create_snippet", { input });
  },

  async updateSnippet(input: UpdateSnippetInput): Promise<SnippetItem> {
    if (!isTauriEnvironment()) {
      return {
        id: input.id,
        title: input.title,
        description: input.description,
        code: input.code,
        language: input.language || "bash",
        category: input.category || "general",
        tags: input.tags ? input.tags.split(",").map((t) => t.trim()) : [],
        is_favorite: !!input.is_favorite,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return await invoke<SnippetItem>("update_snippet", { input });
  },

  async toggleFavorite(id: string): Promise<boolean> {
    if (!isTauriEnvironment()) return true;
    return await invoke<boolean>("toggle_snippet_favorite", { id });
  },

  async incrementUsage(id: string): Promise<number> {
    if (!isTauriEnvironment()) return 1;
    return await invoke<number>("increment_snippet_usage", { id });
  },

  async deleteSnippet(id: string): Promise<boolean> {
    if (!isTauriEnvironment()) return true;
    return await invoke<boolean>("delete_snippet", { id });
  },

  async exportJson(): Promise<string> {
    if (!isTauriEnvironment()) return "[]";
    return await invoke<string>("export_snippets_json");
  },
};

// =============================================================================
// Spaced Repetition (SRS) Engine Service
// =============================================================================
export const srsService = {
  async getOverview(): Promise<SrsOverview> {
    if (!isTauriEnvironment()) {
      return {
        total_items: 8,
        due_today_count: 2,
        mastered_count: 3,
        learning_count: 5,
        due_items: [
          {
            id: "srs-1",
            item_type: "dsa",
            item_id: "dsa-1",
            title: "Course Schedule II (Topological Sort)",
            subtitle: "LeetCode • Review Interval Stage 2",
            content_preview: "Use Kahn's algorithm or DFS post-order traversal to detect cycles and build topological ordering.",
            difficulty: "Medium",
            tags: ["Graphs", "Topological Sort"],
            next_review_date: new Date().toISOString().split("T")[0],
            review_stage: 2,
            ease_factor: 2.5,
            review_count: 2,
            is_overdue: true,
          },
          {
            id: "srs-2",
            item_type: "note",
            item_id: "note-1",
            title: "Operating Systems: Virtual Memory & Page Tables",
            subtitle: "Knowledge Hub Note • Review Stage 1",
            content_preview: "Multi-level page tables reduce memory overhead by allocating secondary tables on-demand...",
            difficulty: "Systems",
            tags: ["Operating Systems", "Memory"],
            next_review_date: new Date().toISOString().split("T")[0],
            review_stage: 1,
            ease_factor: 2.5,
            review_count: 1,
            is_overdue: true,
          },
        ],
      };
    }
    return await invoke<SrsOverview>("get_srs_overview");
  },

  async submitReview(input: SubmitSrsReviewInput): Promise<SrsItem> {
    if (!isTauriEnvironment()) {
      return {
        id: `srs-${input.item_id}`,
        item_type: input.item_type,
        item_id: input.item_id,
        title: "Reviewed Item",
        tags: [],
        next_review_date: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        review_stage: 2,
        ease_factor: 2.5,
        review_count: 1,
        is_overdue: false,
      };
    }
    return await invoke<SrsItem>("submit_srs_review", { input });
  },

  async enrollItem(itemType: string, itemId: string): Promise<boolean> {
    if (!isTauriEnvironment()) return true;
    return await invoke<boolean>("enroll_srs_item", { itemType, itemId });
  },
};
