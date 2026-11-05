export interface SystemInfo {
  app_version: string;
  db_path: string;
  os: string;
  total_tables: number;
}

export interface DashboardStats {
  pending_tasks_count: number;
  active_projects_count: number;
  dsa_solved_count: number;
  current_semester: string;
  weekly_study_hours: number;
  active_goals_count: number;
  upcoming_assessments_count: number;
}
