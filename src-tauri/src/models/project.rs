use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectItem {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub tech_stack: Vec<String>,
    pub repo_url: Option<String>,
    pub live_url: Option<String>,
    pub status: String,
    pub priority: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateProjectInput {
    pub title: String,
    pub description: Option<String>,
    pub tech_stack: Option<String>, // comma separated
    pub repo_url: Option<String>,
    pub live_url: Option<String>,
    pub status: Option<String>,
    pub priority: Option<String>,
}
