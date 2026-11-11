use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteSummary {
    pub id: String,
    pub title: String,
    pub is_pinned: bool,
    pub updated_at: String,
    pub preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteDetail {
    pub id: String,
    pub title: String,
    pub content_markdown: String,
    pub is_pinned: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct SaveNoteInput {
    pub id: Option<String>,
    pub title: String,
    pub content_markdown: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteExportResult {
    pub target_directory: String,
    pub exported_count: usize,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteImportResult {
    pub imported_count: usize,
    pub imported_titles: Vec<String>,
    pub message: String,
}
