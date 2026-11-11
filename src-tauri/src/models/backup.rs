use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableCount {
    pub name: String,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub db_path: String,
    pub file_size_bytes: u64,
    pub last_modified: String,
    pub wal_mode: bool,
    pub tables: Vec<TableCount>,
    pub total_records: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupValidationResult {
    pub is_valid: bool,
    pub file_name: String,
    pub file_path: String,
    pub file_size_bytes: u64,
    pub file_type: String, // "sqlite" or "json"
    pub schema_version: Option<i64>,
    pub total_records: i64,
    pub table_counts: Vec<TableCount>,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RestoreResult {
    pub success: bool,
    pub total_records_restored: i64,
    pub tables_restored: Vec<TableCount>,
    pub message: String,
    pub safety_backup_path: Option<String>,
}
