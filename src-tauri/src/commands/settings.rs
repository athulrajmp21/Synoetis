use rusqlite::params;
use tauri::State;
use crate::error::{AppError, AppResult};
use crate::models::settings::Setting;
use crate::state::AppState;

#[tauri::command]
pub fn get_setting(key: String, state: State<'_, AppState>) -> AppResult<Option<String>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query(params![key])?;
    
    if let Some(row) = rows.next()? {
        let value: String = row.get(0)?;
        Ok(Some(value))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn set_setting(key: String, value: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    
    conn.execute(
        "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        params![key, value],
    )?;

    Ok(())
}

#[tauri::command]
pub fn get_all_settings(state: State<'_, AppState>) -> AppResult<Vec<Setting>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    
    let mut stmt = conn.prepare("SELECT key, value, updated_at FROM settings ORDER BY key ASC")?;
    let settings = stmt
        .query_map([], |row| {
            Ok(Setting {
                key: row.get(0)?,
                value: row.get(1)?,
                updated_at: row.get(2)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(settings)
}
