use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HabitItem {
    pub id: String,
    pub title: String,
    pub category: String,
    pub frequency: String,
    pub streak: i64,
    pub is_completed_today: bool,
}

#[derive(Debug, Deserialize)]
pub struct CreateHabitInput {
    pub title: String,
    pub category: Option<String>,
}
