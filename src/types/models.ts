export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'canceled';
  due_date?: string | null;
  category: string;
  project_id?: string | null;
  goal_id?: string | null;
  course_id?: string | null;
  is_recurring: boolean;
  recurrence_rule?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  category?: string;
  due_date?: string;
  project_id?: string;
}

export interface HabitItem {
  id: string;
  title: string;
  category: string;
  frequency: string;
  streak: number;
  is_completed_today: boolean;
}

export interface CreateHabitInput {
  title: string;
  category?: string;
}

export interface NoteSummary {
  id: string;
  title: string;
  is_pinned: boolean;
  updated_at: string;
  preview: string;
}

export interface NoteDetail {
  id: string;
  title: string;
  content_markdown: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DsaTopicItem {
  id: string;
  name: string;
  slug: string;
}

export interface DsaProblemItem {
  id: string;
  topic_id: string;
  topic_name: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  platform: string;
  url?: string | null;
  independent_solve: boolean;
  confidence_score: number;
  revision_due?: string | null;
}

export interface AddDsaProblemInput {
  topic_name: string;
  title: string;
  difficulty: string;
  platform?: string;
  url?: string;
}

export interface SemesterItem {
  id: string;
  number: number;
  name: string;
  status: string;
  target_gpa?: number | null;
  actual_gpa?: number | null;
}

export interface CourseItem {
  id: string;
  semester_id: string;
  code: string;
  title: string;
  credits: number;
  instructor?: string | null;
  target_grade?: string | null;
  final_grade?: string | null;
  status: string;
}

export interface AssessmentItem {
  id: string;
  course_id: string;
  course_title: string;
  title: string;
  assessment_type: string;
  due_date?: string | null;
  status: string;
  weightage?: number | null;
}

export interface ProjectItem {
  id: string;
  title: string;
  description?: string | null;
  tech_stack: string[];
  repo_url?: string | null;
  live_url?: string | null;
  status: string;
  priority: string;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  tech_stack?: string;
  repo_url?: string;
  live_url?: string;
  status?: string;
  priority?: string;
}

// Career OS Models
export interface CompanyItem {
  id: string;
  name: string;
  website?: string | null;
  tier?: string | null;
  notes?: string | null;
}

export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'oa_round'
  | 'interview'
  | 'offer'
  | 'rejected';

export interface ApplicationItem {
  id: string;
  company_id: string;
  company_name: string;
  company_tier?: string | null;
  company_website?: string | null;
  role: string;
  job_url?: string | null;
  salary_range?: string | null;
  status: ApplicationStatus;
  applied_date?: string | null;
  deadline?: string | null;
  notes?: string | null;
  interviews_count: number;
  updated_at: string;
}

export interface CreateApplicationInput {
  company_name: string;
  company_tier?: string;
  company_website?: string;
  role: string;
  job_url?: string;
  salary_range?: string;
  status?: string;
  applied_date?: string;
  deadline?: string;
  notes?: string;
}

export interface InterviewItem {
  id: string;
  application_id: string;
  company_name?: string | null;
  role?: string | null;
  round_name: string;
  interview_date?: string | null;
  interviewer_info?: string | null;
  questions_asked?: string | null;
  notes?: string | null;
  result: 'pending' | 'passed' | 'failed';
  created_at: string;
}

export interface CreateInterviewInput {
  application_id: string;
  round_name: string;
  interview_date?: string;
  interviewer_info?: string;
  questions_asked?: string;
  notes?: string;
  result?: string;
}

// Goals & Milestones
export type GoalCategory = 'technical' | 'career' | 'academic' | 'personal' | 'fitness';
export type GoalTimeframe = 'quarterly' | 'short_term' | 'long_term' | 'yearly';
export type GoalStatus = 'in_progress' | 'completed' | 'archived';

export interface GoalItem {
  id: string;
  title: string;
  description?: string | null;
  category: GoalCategory | string;
  timeframe: GoalTimeframe | string;
  target_date?: string | null;
  progress: number;
  status: GoalStatus | string;
  created_at: string;
  updated_at: string;
  milestones_count: number;
  completed_milestones_count: number;
}

export interface MilestoneItem {
  id: string;
  goal_id?: string | null;
  project_id?: string | null;
  title: string;
  due_date?: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  category: string;
  timeframe: string;
  target_date?: string;
  initial_milestones?: string[];
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  category?: string;
  timeframe?: string;
  target_date?: string;
  progress?: number;
  status?: string;
}

export interface CreateMilestoneInput {
  goal_id?: string;
  project_id?: string;
  title: string;
  due_date?: string;
}

// Resources & Technical Library
export type ResourceType = 'book' | 'paper' | 'documentation' | 'course' | 'tutorial' | 'article' | 'video';
export type LearningStatus = 'to_read' | 'in_progress' | 'completed';

export interface ResourceItem {
  id: string;
  title: string;
  resource_type: ResourceType | string;
  url?: string | null;
  author?: string | null;
  learning_status: LearningStatus | string;
  rating: number; // 0 to 5
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateResourceInput {
  title: string;
  resource_type: string;
  url?: string;
  author?: string;
  learning_status?: string;
  rating?: number;
  notes?: string;
}

export interface UpdateResourceInput {
  title?: string;
  resource_type?: string;
  url?: string;
  author?: string;
  learning_status?: string;
  rating?: number;
  notes?: string;
}

export interface SelectedFileInfo {
  path: string;
  file_name: string;
  extension: string;
  file_size_bytes: number;
}

export interface ResourceContentResponse {
  file_name: string;
  extension: string;
  file_size_bytes: number;
  is_pdf: boolean;
  is_text: boolean;
  is_image: boolean;
  text_content?: string | null;
  data_url?: string | null;
}

// Backup & Data Portability
export interface TableCount {
  name: string;
  count: number;
}

export interface BackupInfo {
  db_path: string;
  file_size_bytes: number;
  last_modified: string;
  wal_mode: boolean;
  tables: TableCount[];
  total_records: number;
}

export interface BackupValidationResult {
  is_valid: boolean;
  file_name: string;
  file_path: string;
  file_size_bytes: number;
  file_type: "sqlite" | "json" | string;
  schema_version?: number | null;
  total_records: number;
  table_counts: TableCount[];
  error_message?: string | null;
}

export interface RestoreResult {
  success: boolean;
  total_records_restored: number;
  tables_restored: TableCount[];
  message: string;
  safety_backup_path?: string | null;
}

// Velocity & Analytics
export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
  tasks_completed: number;
  habits_completed: number;
  study_minutes: number;
  dsa_solved: number;
}

export interface DsaTopicMastery {
  topic_id: string;
  topic_name: string;
  solved: number;
  total: number;
  percentage: number;
}

export interface DailyVelocity {
  day_name: string;
  date: string;
  study_hours: number;
  tasks_completed: number;
  habits_completed: number;
}

export interface AnalyticsOverview {
  total_study_minutes: number;
  weekly_study_minutes: number;
  total_tasks_completed: number;
  total_habits_completed: number;
  total_dsa_solved: number;
  current_streak_days: number;
  heatmap_days: HeatmapDay[];
  dsa_topics: DsaTopicMastery[];
  weekly_velocity: DailyVelocity[];
}

// Omnisearch
export interface OmniSearchResultItem {
  id: string;
  category: "task" | "resource" | "note" | "dsa" | "career" | "goal" | "project" | "course" | "navigation" | string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  badge_color?: "amber" | "blue" | "emerald" | "purple" | "rose" | "stone" | string | null;
  url_or_path?: string | null;
  target_route: string;
  is_local_file: boolean;
  match_preview?: string | null;
}

export interface OmniSearchResponse {
  query: string;
  total_count: number;
  execution_time_ms: number;
  items: OmniSearchResultItem[];
}

// Snippets & CLI Cheat Sheets
export interface SnippetItem {
  id: string;
  title: string;
  description?: string | null;
  code: string;
  language: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSnippetInput {
  title: string;
  description?: string;
  code: string;
  language?: string;
  category?: string;
  tags?: string;
  is_favorite?: boolean;
}

export interface UpdateSnippetInput {
  id: string;
  title: string;
  description?: string;
  code: string;
  language?: string;
  category?: string;
  tags?: string;
  is_favorite?: boolean;
}

// Academic Class Timetable & GPA Simulator
export interface ClassScheduleItem {
  id: string;
  course_id: string;
  course_code: string;
  course_title: string;
  day_of_week: number; // 1 = Mon ... 5 = Fri, 6 = Sat, 7 = Sun
  start_time: string; // "09:30"
  end_time: string; // "11:00"
  room?: string | null;
  building?: string | null;
  class_type: "lecture" | "lab" | "tutorial" | "seminar" | string;
}

export interface CreateClassScheduleInput {
  course_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  building?: string;
  class_type?: string;
}

export interface SimulatedCourseGrade {
  course_id: string;
  credits: number;
  simulated_grade: string;
}

export interface GpaSimulationInput {
  current_completed_credits: number;
  current_cumulative_gpa: number;
  simulated_courses: SimulatedCourseGrade[];
}

export interface GpaSimulationResult {
  semester_credits: number;
  semester_gpa: number;
  cumulative_credits: number;
  projected_cumulative_gpa: number;
  gpa_change: number;
}

// Spaced Repetition (SRS) Engine
export interface SrsItem {
  id: string;
  item_type: "dsa" | "note" | string;
  item_id: string;
  title: string;
  subtitle?: string | null;
  content_preview?: string | null;
  difficulty?: string | null;
  tags: string[];
  next_review_date: string;
  review_stage: number;
  ease_factor: number;
  review_count: number;
  last_reviewed_at?: string | null;
  is_overdue: boolean;
}

export interface SrsOverview {
  total_items: number;
  due_today_count: number;
  mastered_count: number;
  learning_count: number;
  due_items: SrsItem[];
}

export interface SubmitSrsReviewInput {
  item_type: string;
  item_id: string;
  rating: "again" | "hard" | "good" | "easy" | string;
}

// Markdown Local Folder Sync & Batch Export
export interface NoteExportResult {
  target_directory: string;
  exported_count: number;
  message: string;
}

export interface NoteImportResult {
  imported_count: number;
  imported_titles: string[];
  message: string;
}
