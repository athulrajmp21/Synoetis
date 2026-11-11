use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnippetItem {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub code: String,
    pub language: String,
    pub category: String,
    pub tags: Vec<String>,
    pub is_favorite: bool,
    pub usage_count: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateSnippetInput {
    pub title: String,
    pub description: Option<String>,
    pub code: String,
    pub language: Option<String>,
    pub category: Option<String>,
    pub tags: Option<String>, // comma-separated
    pub is_favorite: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateSnippetInput {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub code: String,
    pub language: Option<String>,
    pub category: Option<String>,
    pub tags: Option<String>, // comma-separated
    pub is_favorite: Option<bool>,
}
