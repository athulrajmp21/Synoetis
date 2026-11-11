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
    
    if !app_dir.exists() {
        let _ = fs::create_dir_all(&app_dir);
    }

    let new_db_path = app_dir.join("synoetis.db");

    // Seamless automatic migration from legacy lifeos.db if it exists
    if !new_db_path.exists() {
        let legacy_in_current_dir = app_dir.join("lifeos.db");
        if legacy_in_current_dir.exists() {
            let _ = fs::copy(&legacy_in_current_dir, &new_db_path);
            let legacy_wal = app_dir.join("lifeos.db-wal");
            if legacy_wal.exists() {
                let _ = fs::copy(&legacy_wal, app_dir.join("synoetis.db-wal"));
            }
            let legacy_shm = app_dir.join("lifeos.db-shm");
            if legacy_shm.exists() {
                let _ = fs::copy(&legacy_shm, app_dir.join("synoetis.db-shm"));
            }
        } else if let Some(parent) = app_dir.parent() {
            let old_lifeos_dir = parent.join("com.lifeos.desktop");
            let old_lifeos_db = old_lifeos_dir.join("lifeos.db");
            if old_lifeos_db.exists() {
                let _ = fs::copy(&old_lifeos_db, &new_db_path);
                let old_wal = old_lifeos_dir.join("lifeos.db-wal");
                if old_wal.exists() {
                    let _ = fs::copy(&old_wal, app_dir.join("synoetis.db-wal"));
                }
                let old_shm = old_lifeos_dir.join("lifeos.db-shm");
                if old_shm.exists() {
                    let _ = fs::copy(&old_shm, app_dir.join("synoetis.db-shm"));
                }
            }
        }
    }
    
    Ok(new_db_path)
}
