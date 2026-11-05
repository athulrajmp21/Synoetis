use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub app_version: String,
    pub db_path: String,
    pub os: String,
    pub total_tables: i64,
}
