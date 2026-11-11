use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SrsItem {
    pub id: String,
    pub item_type: String, // "dsa" or "note"
    pub item_id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub content_preview: Option<String>,
    pub difficulty: Option<String>,
    pub tags: Vec<String>,
    pub next_review_date: String,
    pub review_stage: i64,
    pub ease_factor: f64,
    pub review_count: i64,
    pub last_reviewed_at: Option<String>,
    pub is_overdue: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SrsOverview {
    pub total_items: i64,
    pub due_today_count: i64,
    pub mastered_count: i64,
    pub learning_count: i64,
    pub due_items: Vec<SrsItem>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SubmitSrsReviewInput {
    pub item_type: String, // "dsa" or "note"
    pub item_id: String,
    pub rating: String, // "again", "hard", "good", "easy"
}
