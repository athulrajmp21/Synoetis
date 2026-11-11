use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OmniSearchResultItem {
    pub id: String,
    pub category: String, // "task" | "resource" | "note" | "dsa" | "career" | "goal" | "project" | "course" | "navigation"
    pub title: String,
    pub subtitle: Option<String>,
    pub badge: Option<String>,
    pub badge_color: Option<String>, // "amber" | "blue" | "emerald" | "purple" | "rose" | "stone"
    pub url_or_path: Option<String>,
    pub target_route: String,
    pub is_local_file: bool,
    pub match_preview: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OmniSearchResponse {
    pub query: String,
    pub total_count: usize,
    pub execution_time_ms: u128,
    pub items: Vec<OmniSearchResultItem>,
}
