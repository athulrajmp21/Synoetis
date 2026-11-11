use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GoalItem {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub category: String,
    pub timeframe: String,
    pub target_date: Option<String>,
    pub progress: f64,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub milestones_count: i64,
    pub completed_milestones_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MilestoneItem {
    pub id: String,
    pub goal_id: Option<String>,
    pub project_id: Option<String>,
    pub title: String,
    pub due_date: Option<String>,
    pub is_completed: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateGoalInput {
    pub title: String,
    pub description: Option<String>,
    pub category: String,
    pub timeframe: String,
    pub target_date: Option<String>,
    pub initial_milestones: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateGoalInput {
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub timeframe: Option<String>,
    pub target_date: Option<String>,
    pub progress: Option<f64>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateMilestoneInput {
    pub goal_id: Option<String>,
    pub project_id: Option<String>,
    pub title: String,
    pub due_date: Option<String>,
}
