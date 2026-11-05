use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardStats {
    pub pending_tasks_count: i64,
    pub active_projects_count: i64,
    pub dsa_solved_count: i64,
    pub current_semester: String,
    pub weekly_study_hours: f64,
    pub active_goals_count: i64,
    pub upcoming_assessments_count: i64,
}
