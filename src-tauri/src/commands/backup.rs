use std::fs;
use std::path::PathBuf;
use rusqlite::backup::Backup;
use rusqlite::params;
use tauri::{AppHandle, Manager, State};

use crate::error::{AppError, AppResult};
use crate::models::backup::{BackupInfo, BackupValidationResult, RestoreResult, TableCount};
use crate::state::AppState;

#[tauri::command]
pub fn get_backup_info(
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<BackupInfo> {
    let db_path = crate::db::get_db_path(&app)?;
    let metadata = fs::metadata(&db_path).map_err(|e| AppError::Internal(e.to_string()))?;
    let file_size_bytes = metadata.len();
    
    let last_modified = metadata
        .modified()
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Local> = t.into();
            datetime.format("%Y-%m-%d %H:%M:%S").to_string()
        })
        .unwrap_or_else(|_| "Unknown".to_string());

    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let table_names = [
        "tasks",
        "habits",
        "notes",
        "dsa_problems",
        "courses",
        "assessments",
        "projects",
        "applications",
        "interviews",
        "goals",
        "milestones",
        "resources",
        "study_sessions",
    ];

    let mut tables = Vec::new();
    let mut total_records = 0;

    for name in table_names {
        let count: i64 = conn
            .query_row(&format!("SELECT COUNT(*) FROM {name}"), [], |row| row.get(0))
            .unwrap_or(0);
        total_records += count;
        tables.push(TableCount {
            name: name.to_string(),
            count,
        });
    }

    Ok(BackupInfo {
        db_path: db_path.to_string_lossy().to_string(),
        file_size_bytes,
        last_modified,
        wal_mode: true,
        tables,
        total_records,
    })
}

#[tauri::command]
pub fn export_database_backup(
    destination_folder: Option<String>,
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<String> {
    let dest_dir = if let Some(folder) = destination_folder {
        PathBuf::from(folder)
    } else {
        // Default to user's Downloads or Desktop directory
        app.path()
            .download_dir()
            .or_else(|_| app.path().desktop_dir())
            .map_err(|e| AppError::Tauri(e.to_string()))?
    };

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    }

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let target_filename = format!("Synoetis_Backup_{timestamp}.db");
    let target_path = dest_dir.join(target_filename);
    let target_path_str = target_path.to_string_lossy().to_string();

    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // Checkpoint WAL first to flush any uncommitted WAL pages into main DB
    let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");

    // SQLite official online vacuum backup
    conn.execute("VACUUM INTO ?1", params![target_path_str])?;

    Ok(target_path_str)
}

#[tauri::command]
pub fn export_json_archive(
    destination_folder: Option<String>,
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<String> {
    let dest_dir = if let Some(folder) = destination_folder {
        PathBuf::from(folder)
    } else {
        app.path()
            .download_dir()
            .or_else(|_| app.path().desktop_dir())
            .map_err(|e| AppError::Tauri(e.to_string()))?
    };

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    }

    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let target_filename = format!("Synoetis_Archive_{timestamp}.json");
    let target_path = dest_dir.join(target_filename);

    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // Fetch primary collections
    let tasks: Vec<serde_json::Value> = {
        let mut stmt = conn.prepare("SELECT id, title, description, priority, status, category, due_date FROM tasks")?;
        let rows = stmt.query_map([], |r| {
            Ok(serde_json::json!({
                "id": r.get::<_, String>(0)?,
                "title": r.get::<_, String>(1)?,
                "description": r.get::<_, Option<String>>(2)?,
                "priority": r.get::<_, String>(3)?,
                "status": r.get::<_, String>(4)?,
                "category": r.get::<_, String>(5)?,
                "due_date": r.get::<_, Option<String>>(6)?,
            }))
        })?;
        rows.filter_map(|r| r.ok()).collect()
    };

    let habits: Vec<serde_json::Value> = {
        let mut stmt = conn.prepare("SELECT id, title, category, frequency FROM habits")?;
        let rows = stmt.query_map([], |r| {
            Ok(serde_json::json!({
                "id": r.get::<_, String>(0)?,
                "title": r.get::<_, String>(1)?,
                "category": r.get::<_, String>(2)?,
                "frequency": r.get::<_, String>(3)?,
            }))
        })?;
        rows.filter_map(|r| r.ok()).collect()
    };

    let notes: Vec<serde_json::Value> = {
        let mut stmt = conn.prepare("SELECT id, title, content_markdown, is_pinned, created_at FROM notes")?;
        let rows = stmt.query_map([], |r| {
            Ok(serde_json::json!({
                "id": r.get::<_, String>(0)?,
                "title": r.get::<_, String>(1)?,
                "content_markdown": r.get::<_, String>(2)?,
                "is_pinned": r.get::<_, i64>(3)? == 1,
                "created_at": r.get::<_, String>(4)?,
            }))
        })?;
        rows.filter_map(|r| r.ok()).collect()
    };

    let dsa: Vec<serde_json::Value> = {
        let mut stmt = conn.prepare("SELECT id, topic_id, title, difficulty, platform, url, independent_solve, confidence_score FROM dsa_problems")?;
        let rows = stmt.query_map([], |r| {
            Ok(serde_json::json!({
                "id": r.get::<_, String>(0)?,
                "topic_id": r.get::<_, String>(1)?,
                "title": r.get::<_, String>(2)?,
                "difficulty": r.get::<_, String>(3)?,
                "platform": r.get::<_, String>(4)?,
                "url": r.get::<_, Option<String>>(5)?,
                "independent_solve": r.get::<_, i64>(6)? == 1,
                "confidence_score": r.get::<_, i64>(7)?,
            }))
        })?;
        rows.filter_map(|r| r.ok()).collect()
    };

    let goals: Vec<serde_json::Value> = {
        let mut stmt = conn.prepare("SELECT id, title, description, category, timeframe, target_date, progress, status FROM goals")?;
        let rows = stmt.query_map([], |r| {
            Ok(serde_json::json!({
                "id": r.get::<_, String>(0)?,
                "title": r.get::<_, String>(1)?,
                "description": r.get::<_, Option<String>>(2)?,
                "category": r.get::<_, String>(3)?,
                "timeframe": r.get::<_, String>(4)?,
                "target_date": r.get::<_, Option<String>>(5)?,
                "progress": r.get::<_, f64>(6)?,
                "status": r.get::<_, String>(7)?,
            }))
        })?;
        rows.filter_map(|r| r.ok()).collect()
    };

    let resources: Vec<serde_json::Value> = {
        let mut stmt = conn.prepare("SELECT id, title, resource_type, url, author, learning_status, rating, notes FROM resources")?;
        let rows = stmt.query_map([], |r| {
            Ok(serde_json::json!({
                "id": r.get::<_, String>(0)?,
                "title": r.get::<_, String>(1)?,
                "resource_type": r.get::<_, String>(2)?,
                "url": r.get::<_, Option<String>>(3)?,
                "author": r.get::<_, Option<String>>(4)?,
                "learning_status": r.get::<_, String>(5)?,
                "rating": r.get::<_, i64>(6)?,
                "notes": r.get::<_, Option<String>>(7)?,
            }))
        })?;
        rows.filter_map(|r| r.ok()).collect()
    };

    let archive = serde_json::json!({
        "app": "Synoetis",
        "version": "0.1.0",
        "exported_at": chrono::Local::now().to_rfc3339(),
        "tasks": tasks,
        "habits": habits,
        "notes": notes,
        "dsa_problems": dsa,
        "goals": goals,
        "resources": resources,
    });

    let json_str = serde_json::to_string_pretty(&archive)
        .map_err(|e| AppError::Internal(e.to_string()))?;

    fs::write(&target_path, json_str).map_err(|e| AppError::Internal(e.to_string()))?;

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn pick_backup_file() -> AppResult<Option<String>> {
    let file = rfd::FileDialog::new()
        .set_title("Select Synoetis Database Backup or Archive")
        .add_filter(
            "Synoetis Backups (*.db, *.sqlite, *.json)",
            &["db", "sqlite", "json"],
        )
        .add_filter("SQLite Database Snapshot (*.db, *.sqlite)", &["db", "sqlite"])
        .add_filter("Portable JSON Data Archive (*.json)", &["json"])
        .add_filter("All Files (*.*)", &["*"])
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn validate_backup_file(path: String) -> AppResult<BackupValidationResult> {
    use std::path::Path;
    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Ok(BackupValidationResult {
            is_valid: false,
            file_name: path.clone(),
            file_path: path,
            file_size_bytes: 0,
            file_type: "unknown".to_string(),
            schema_version: None,
            total_records: 0,
            table_counts: Vec::new(),
            error_message: Some("File does not exist at specified path.".to_string()),
        });
    }

    let file_name = file_path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_else(|| "backup".to_string());
    let ext = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();
    let file_size_bytes = fs::metadata(file_path).map(|m| m.len()).unwrap_or(0);

    if ext == "json" {
        // Validate JSON Archive
        let content = match fs::read_to_string(file_path) {
            Ok(c) => c,
            Err(e) => {
                return Ok(BackupValidationResult {
                    is_valid: false,
                    file_name,
                    file_path: path,
                    file_size_bytes,
                    file_type: "json".to_string(),
                    schema_version: None,
                    total_records: 0,
                    table_counts: Vec::new(),
                    error_message: Some(format!("Failed to read JSON file: {}", e)),
                });
            }
        };

        let val: serde_json::Value = match serde_json::from_str(&content) {
            Ok(v) => v,
            Err(e) => {
                return Ok(BackupValidationResult {
                    is_valid: false,
                    file_name,
                    file_path: path,
                    file_size_bytes,
                    file_type: "json".to_string(),
                    schema_version: None,
                    total_records: 0,
                    table_counts: Vec::new(),
                    error_message: Some(format!("Invalid JSON syntax: {}", e)),
                });
            }
        };

        let app_name = val.get("app").and_then(|a| a.as_str());
        if app_name != Some("Life OS") {
            return Ok(BackupValidationResult {
                is_valid: false,
                file_name,
                file_path: path,
                file_size_bytes,
                file_type: "json".to_string(),
                schema_version: None,
                total_records: 0,
                table_counts: Vec::new(),
                error_message: Some("JSON file is not a valid Life OS exported archive (missing 'app': 'Life OS').".to_string()),
            });
        }

        let mut table_counts = Vec::new();
        let mut total_records = 0;
        let table_keys = ["tasks", "habits", "notes", "dsa_problems", "goals", "resources"];
        for key in table_keys {
            let count = val.get(key).and_then(|arr| arr.as_array()).map(|a| a.len() as i64).unwrap_or(0);
            total_records += count;
            table_counts.push(TableCount {
                name: key.to_string(),
                count,
            });
        }

        return Ok(BackupValidationResult {
            is_valid: true,
            file_name,
            file_path: path,
            file_size_bytes,
            file_type: "json".to_string(),
            schema_version: Some(1),
            total_records,
            table_counts,
            error_message: None,
        });
    }

    // SQLite Database Validation (.db / .sqlite)
    let conn = match rusqlite::Connection::open_with_flags(
        file_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
    ) {
        Ok(c) => c,
        Err(e) => {
            return Ok(BackupValidationResult {
                is_valid: false,
                file_name,
                file_path: path,
                file_size_bytes,
                file_type: "sqlite".to_string(),
                schema_version: None,
                total_records: 0,
                table_counts: Vec::new(),
                error_message: Some(format!("Could not open SQLite database: {}", e)),
            });
        }
    };

    // Run PRAGMA integrity_check
    let integrity_status: String = match conn.query_row("PRAGMA integrity_check(1);", [], |r| r.get(0)) {
        Ok(s) => s,
        Err(e) => format!("Error checking integrity: {}", e),
    };

    if integrity_status != "ok" {
        return Ok(BackupValidationResult {
            is_valid: false,
            file_name,
            file_path: path,
            file_size_bytes,
            file_type: "sqlite".to_string(),
            schema_version: None,
            total_records: 0,
            table_counts: Vec::new(),
            error_message: Some(format!("SQLite integrity check failed: {}", integrity_status)),
        });
    }

    // Check schema version from schema_migrations or pragma user_version
    let schema_version: Option<i64> = conn
        .query_row("SELECT MAX(version) FROM schema_migrations;", [], |r| r.get(0))
        .or_else(|_| conn.query_row("PRAGMA user_version;", [], |r| r.get(0)))
        .ok();

    // Check table counts
    let table_names = [
        "tasks",
        "habits",
        "notes",
        "dsa_problems",
        "courses",
        "assessments",
        "projects",
        "applications",
        "interviews",
        "goals",
        "milestones",
        "resources",
        "study_sessions",
    ];

    let mut table_counts = Vec::new();
    let mut total_records = 0;
    for name in table_names {
        let table_exists: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?1",
                params![name],
                |r| r.get(0),
            )
            .unwrap_or(0);

        if table_exists > 0 {
            let count: i64 = conn
                .query_row(&format!("SELECT COUNT(*) FROM {name}"), [], |row| row.get(0))
                .unwrap_or(0);
            total_records += count;
            table_counts.push(TableCount {
                name: name.to_string(),
                count,
            });
        }
    }

    let has_core = table_counts.iter().any(|t| t.name == "tasks")
        || table_counts.iter().any(|t| t.name == "notes")
        || table_counts.iter().any(|t| t.name == "resources");

    if !has_core {
        return Ok(BackupValidationResult {
            is_valid: false,
            file_name,
            file_path: path,
            file_size_bytes,
            file_type: "sqlite".to_string(),
            schema_version,
            total_records,
            table_counts,
            error_message: Some("Database does not contain recognized Synoetis core tables.".to_string()),
        });
    }

    Ok(BackupValidationResult {
        is_valid: true,
        file_name,
        file_path: path,
        file_size_bytes,
        file_type: "sqlite".to_string(),
        schema_version,
        total_records,
        table_counts,
        error_message: None,
    })
}

#[tauri::command]
pub fn restore_database_from_backup(
    path: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<RestoreResult> {
    use std::path::Path;
    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Err(AppError::NotFound(format!("Backup file not found: {}", path)));
    }

    let ext = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let mut conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // Step 1: Create automatic safety snapshot of active database before overwrite
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Tauri(e.to_string()))?;
    let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S").to_string();
    let safety_file_name = format!("Synoetis_PreRestore_Safety_{timestamp}.db");
    let safety_path = app_dir.join(&safety_file_name);
    let safety_path_str = safety_path.to_string_lossy().to_string();

    // Checkpoint active WAL before taking safety snapshot
    let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");
    let _ = conn.execute("VACUUM INTO ?1", params![safety_path_str]);

    let mut tables_restored = Vec::new();
    let mut total_records_restored = 0;

    if ext == "json" {
        // Restore from JSON archive
        let content = fs::read_to_string(file_path)
            .map_err(|e| AppError::Internal(format!("Failed to read JSON: {}", e)))?;
        let val: serde_json::Value = serde_json::from_str(&content)
            .map_err(|e| AppError::Validation(format!("Invalid JSON: {}", e)))?;

        let tx = conn.transaction()?;

        // Tasks
        if let Some(tasks) = val.get("tasks").and_then(|t| t.as_array()) {
            for t in tasks {
                if let (Some(id), Some(title)) = (t.get("id").and_then(|v| v.as_str()), t.get("title").and_then(|v| v.as_str())) {
                    let desc = t.get("description").and_then(|v| v.as_str());
                    let priority = t.get("priority").and_then(|v| v.as_str()).unwrap_or("medium");
                    let status = t.get("status").and_then(|v| v.as_str()).unwrap_or("todo");
                    let category = t.get("category").and_then(|v| v.as_str()).unwrap_or("general");
                    let due_date = t.get("due_date").and_then(|v| v.as_str());

                    let _ = tx.execute(
                        "INSERT INTO tasks (id, title, description, priority, status, category, due_date)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                         ON CONFLICT(id) DO UPDATE SET
                            title = excluded.title,
                            description = excluded.description,
                            priority = excluded.priority,
                            status = excluded.status,
                            category = excluded.category,
                            due_date = excluded.due_date,
                            updated_at = datetime('now')",
                        params![id, title, desc, priority, status, category, due_date],
                    );
                }
            }
            tables_restored.push(TableCount { name: "tasks".to_string(), count: tasks.len() as i64 });
            total_records_restored += tasks.len() as i64;
        }

        // Notes
        if let Some(notes) = val.get("notes").and_then(|n| n.as_array()) {
            for n in notes {
                if let (Some(id), Some(title), Some(content)) = (
                    n.get("id").and_then(|v| v.as_str()),
                    n.get("title").and_then(|v| v.as_str()),
                    n.get("content_markdown").and_then(|v| v.as_str()),
                ) {
                    let is_pinned = if n.get("is_pinned").and_then(|v| v.as_bool()).unwrap_or(false) { 1 } else { 0 };
                    let _ = tx.execute(
                        "INSERT INTO notes (id, title, content_markdown, is_pinned)
                         VALUES (?1, ?2, ?3, ?4)
                         ON CONFLICT(id) DO UPDATE SET
                            title = excluded.title,
                            content_markdown = excluded.content_markdown,
                            is_pinned = excluded.is_pinned,
                            updated_at = datetime('now')",
                        params![id, title, content, is_pinned],
                    );
                }
            }
            tables_restored.push(TableCount { name: "notes".to_string(), count: notes.len() as i64 });
            total_records_restored += notes.len() as i64;
        }

        // Resources
        if let Some(res) = val.get("resources").and_then(|r| r.as_array()) {
            for r in res {
                if let (Some(id), Some(title), Some(rtype)) = (
                    r.get("id").and_then(|v| v.as_str()),
                    r.get("title").and_then(|v| v.as_str()),
                    r.get("resource_type").and_then(|v| v.as_str()),
                ) {
                    let url = r.get("url").and_then(|v| v.as_str());
                    let author = r.get("author").and_then(|v| v.as_str());
                    let status = r.get("learning_status").and_then(|v| v.as_str()).unwrap_or("to_read");
                    let rating = r.get("rating").and_then(|v| v.as_i64()).unwrap_or(0);
                    let notes_text = r.get("notes").and_then(|v| v.as_str());

                    let _ = tx.execute(
                        "INSERT INTO resources (id, title, resource_type, url, author, learning_status, rating, notes)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
                         ON CONFLICT(id) DO UPDATE SET
                            title = excluded.title,
                            resource_type = excluded.resource_type,
                            url = excluded.url,
                            author = excluded.author,
                            learning_status = excluded.learning_status,
                            rating = excluded.rating,
                            notes = excluded.notes,
                            updated_at = datetime('now')",
                        params![id, title, rtype, url, author, status, rating, notes_text],
                    );
                }
            }
            tables_restored.push(TableCount { name: "resources".to_string(), count: res.len() as i64 });
            total_records_restored += res.len() as i64;
        }

        // DSA Problems
        if let Some(dsa) = val.get("dsa_problems").and_then(|d| d.as_array()) {
            for d in dsa {
                if let (Some(id), Some(topic_id), Some(title)) = (
                    d.get("id").and_then(|v| v.as_str()),
                    d.get("topic_id").and_then(|v| v.as_str()),
                    d.get("title").and_then(|v| v.as_str()),
                ) {
                    let diff = d.get("difficulty").and_then(|v| v.as_str()).unwrap_or("Medium");
                    let platform = d.get("platform").and_then(|v| v.as_str()).unwrap_or("LeetCode");
                    let url = d.get("url").and_then(|v| v.as_str());
                    let _ = tx.execute(
                        "INSERT INTO dsa_problems (id, topic_id, title, difficulty, platform, url)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
                         ON CONFLICT(id) DO UPDATE SET
                            title = excluded.title,
                            difficulty = excluded.difficulty,
                            platform = excluded.platform,
                            url = excluded.url,
                            updated_at = datetime('now')",
                        params![id, topic_id, title, diff, platform, url],
                    );
                }
            }
            tables_restored.push(TableCount { name: "dsa_problems".to_string(), count: dsa.len() as i64 });
            total_records_restored += dsa.len() as i64;
        }

        // Goals
        if let Some(goals) = val.get("goals").and_then(|g| g.as_array()) {
            for g in goals {
                if let (Some(id), Some(title)) = (g.get("id").and_then(|v| v.as_str()), g.get("title").and_then(|v| v.as_str())) {
                    let desc = g.get("description").and_then(|v| v.as_str());
                    let category = g.get("category").and_then(|v| v.as_str()).unwrap_or("career");
                    let timeframe = g.get("timeframe").and_then(|v| v.as_str()).unwrap_or("quarterly");
                    let progress = g.get("progress").and_then(|v| v.as_f64()).unwrap_or(0.0);
                    let status = g.get("status").and_then(|v| v.as_str()).unwrap_or("in_progress");

                    let _ = tx.execute(
                        "INSERT INTO goals (id, title, description, category, timeframe, progress, status)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                         ON CONFLICT(id) DO UPDATE SET
                            title = excluded.title,
                            description = excluded.description,
                            category = excluded.category,
                            timeframe = excluded.timeframe,
                            progress = excluded.progress,
                            status = excluded.status,
                            updated_at = datetime('now')",
                        params![id, title, desc, category, timeframe, progress, status],
                    );
                }
            }
            tables_restored.push(TableCount { name: "goals".to_string(), count: goals.len() as i64 });
            total_records_restored += goals.len() as i64;
        }

        tx.commit()?;
    } else {
        // Restore from SQLite .db snapshot using SQLite Online Backup API
        let backup_conn = rusqlite::Connection::open_with_flags(
            file_path,
            rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY | rusqlite::OpenFlags::SQLITE_OPEN_NO_MUTEX,
        ).map_err(|e| AppError::Internal(format!("Failed to open backup database: {}", e)))?;

        // Atomically copy backup database into active running connection using SQLite Backup API
        {
            let backup = Backup::new(&backup_conn, &mut *conn)
                .map_err(|e| AppError::Internal(format!("Failed to initialize SQLite backup: {}", e)))?;
            backup.run_to_completion(100, std::time::Duration::from_millis(20), None)
                .map_err(|e| AppError::Internal(format!("Failed to complete SQLite restore: {}", e)))?;
        }

        // Run migrations on restored connection to update schema to latest if backup was from earlier version
        let _ = crate::db::migrations::run_migrations(&mut *conn);

        // Checkpoint WAL
        let _ = conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);");

        // Count restored tables
        let table_names = [
            "tasks",
            "habits",
            "notes",
            "dsa_problems",
            "courses",
            "assessments",
            "projects",
            "applications",
            "interviews",
            "goals",
            "milestones",
            "resources",
            "study_sessions",
        ];

        for name in table_names {
            let count: i64 = conn
                .query_row(&format!("SELECT COUNT(*) FROM {name}"), [], |row| row.get(0))
                .unwrap_or(0);
            total_records_restored += count;
            tables_restored.push(TableCount {
                name: name.to_string(),
                count,
            });
        }
    }

    let summary_message = format!(
        "Successfully restored {} records across {} tables.",
        total_records_restored,
        tables_restored.len()
    );

    Ok(RestoreResult {
        success: true,
        total_records_restored,
        tables_restored,
        message: summary_message,
        safety_backup_path: Some(safety_path_str),
    })
}
