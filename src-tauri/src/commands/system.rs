use tauri::{AppHandle, State};
use crate::error::{AppError, AppResult};
use crate::models::system::SystemInfo;
use crate::state::AppState;
use crate::db::get_db_path;

#[tauri::command]
pub fn get_system_info(app_handle: AppHandle, state: State<'_, AppState>) -> AppResult<SystemInfo> {
    let db_path = get_db_path(&app_handle)?
        .to_string_lossy()
        .to_string();

    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    
    let total_tables: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        [],
        |row| row.get(0),
    )?;

    Ok(SystemInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        db_path,
        os: std::env::consts::OS.to_string(),
        total_tables,
    })
}
