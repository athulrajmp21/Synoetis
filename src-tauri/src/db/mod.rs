pub mod migrations;
pub mod schema;

use std::fs;
use std::path::PathBuf;
use rusqlite::Connection;
use tauri::{AppHandle, Manager};
use crate::error::{AppError, AppResult};

pub fn init_db(app_handle: &AppHandle) -> AppResult<Connection> {
    let db_path = get_db_path(app_handle)?;

    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }

    let mut conn = Connection::open(&db_path)?;

    // Configure PRAGMAs for performance, data integrity, and crash safety
    conn.execute_batch(
        "PRAGMA foreign_keys = ON;
         PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA busy_timeout = 5000;"
    )?;

    // Run versioned migrations
    migrations::run_migrations(&mut conn)?;

    Ok(conn)
}

pub fn get_db_path(app_handle: &AppHandle) -> AppResult<PathBuf> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Tauri(e.to_string()))?;
    
    Ok(app_dir.join("lifeos.db"))
}
