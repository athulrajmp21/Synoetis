use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceItem {
    pub id: String,
    pub title: String,
    pub resource_type: String, // 'book', 'paper', 'documentation', 'course', 'tutorial', 'article', 'video'
    pub url: Option<String>,
    pub author: Option<String>,
    pub learning_status: String, // 'to_read', 'in_progress', 'completed'
    pub rating: i64,            // 0 to 5
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct CreateResourceInput {
    pub title: String,
    pub resource_type: String,
    pub url: Option<String>,
    pub author: Option<String>,
    pub learning_status: Option<String>,
    pub rating: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UpdateResourceInput {
    pub title: Option<String>,
    pub resource_type: Option<String>,
    pub url: Option<String>,
    pub author: Option<String>,
    pub learning_status: Option<String>,
    pub rating: Option<i64>,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SelectedFileInfo {
    pub path: String,
    pub file_name: String,
    pub extension: String,
    pub file_size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceContentResponse {
    pub file_name: String,
    pub extension: String,
    pub file_size_bytes: u64,
    pub is_pdf: bool,
    pub is_text: bool,
    pub is_image: bool,
    pub text_content: Option<String>,
    pub data_url: Option<String>,
}
