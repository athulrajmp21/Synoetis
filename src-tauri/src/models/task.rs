use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub priority: String,
    pub status: String,
    pub due_date: Option<String>,
    pub category: String,
    pub project_id: Option<String>,
    pub goal_id: Option<String>,
    pub course_id: Option<String>,
    pub is_recurring: bool,
    pub recurrence_rule: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskInput {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub category: Option<String>,
    pub due_date: Option<String>,
    pub project_id: Option<String>,
}
