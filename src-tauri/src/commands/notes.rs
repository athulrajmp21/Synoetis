use std::fs;
use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;
use crate::error::{AppError, AppResult};
use crate::models::note::{NoteDetail, NoteExportResult, NoteImportResult, NoteSummary, SaveNoteInput};
use crate::state::AppState;

#[tauri::command]
pub fn get_notes(state: State<'_, AppState>) -> AppResult<Vec<NoteSummary>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, title, is_pinned, updated_at, substr(content_markdown, 1, 120) as preview 
         FROM notes 
         WHERE is_archived = 0 
         ORDER BY is_pinned DESC, updated_at DESC"
    )?;

    let rows = stmt.query_map([], |row| {
        let is_pinned_int: i32 = row.get(2)?;
        Ok(NoteSummary {
            id: row.get(0)?,
            title: row.get(1)?,
            is_pinned: is_pinned_int == 1,
            updated_at: row.get(3)?,
            preview: row.get::<_, Option<String>>(4)?.unwrap_or_default(),
        })
    })?;

    let mut notes = Vec::new();
    for r in rows {
        notes.push(r?);
    }
    Ok(notes)
}

#[tauri::command]
pub fn get_note_by_id(id: String, state: State<'_, AppState>) -> AppResult<Option<NoteDetail>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, title, content_markdown, is_pinned, created_at, updated_at 
         FROM notes WHERE id = ?1"
    )?;

    let mut rows = stmt.query([&id])?;
    if let Some(row) = rows.next()? {
        let is_pinned_int: i32 = row.get(3)?;
        Ok(Some(NoteDetail {
            id: row.get(0)?,
            title: row.get(1)?,
            content_markdown: row.get(2)?,
            is_pinned: is_pinned_int == 1,
            created_at: row.get(4)?,
            updated_at: row.get(5)?,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn save_note(input: SaveNoteInput, state: State<'_, AppState>) -> AppResult<NoteDetail> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());

    conn.execute(
        "INSERT INTO notes (id, title, content_markdown, is_pinned, is_archived, created_at, updated_at)
         VALUES (?1, ?2, ?3, 0, 0, datetime('now'), datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            content_markdown = excluded.content_markdown,
            updated_at = datetime('now')",
        rusqlite::params![&id, &input.title, &input.content_markdown],
    )?;

    let note = conn.query_row(
        "SELECT id, title, content_markdown, is_pinned, created_at, updated_at 
         FROM notes WHERE id = ?1",
        [&id],
        |row| {
            let is_pinned_int: i32 = row.get(3)?;
            Ok(NoteDetail {
                id: row.get(0)?,
                title: row.get(1)?,
                content_markdown: row.get(2)?,
                is_pinned: is_pinned_int == 1,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
            })
        },
    )?;

    Ok(note)
}

#[tauri::command]
pub fn delete_note(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM notes WHERE id = ?1", [&id])?;
    Ok(())
}

fn sanitize_filename(name: &str) -> String {
    let invalid = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let sanitized: String = name
        .chars()
        .map(|c| if invalid.contains(&c) { '_' } else { c })
        .collect();
    let trimmed = sanitized.trim().replace(' ', "_");
    if trimmed.is_empty() {
        "untitled_note".to_string()
    } else {
        trimmed
    }
}

fn json_blocks_to_markdown(title: &str, raw_content: &str, created_at: &str, updated_at: &str, is_pinned: bool) -> String {
    let mut md = String::new();
    // Frontmatter
    md.push_str("---\n");
    md.push_str(&format!("title: \"{}\"\n", title.replace('"', "\\\"")));
    md.push_str(&format!("created_at: \"{}\"\n", created_at));
    md.push_str(&format!("updated_at: \"{}\"\n", updated_at));
    md.push_str(&format!("is_pinned: {}\n", is_pinned));
    md.push_str("---\n\n");

    if raw_content.trim_start().starts_with('[') {
        if let Ok(blocks) = serde_json::from_str::<Vec<serde_json::Value>>(raw_content) {
            for b in blocks {
                let b_type = b.get("type").and_then(|v| v.as_str()).unwrap_or("paragraph");
                let content = b.get("content").and_then(|v| v.as_str()).unwrap_or("");
                let checked = b.get("checked").and_then(|v| v.as_bool()).unwrap_or(false);
                let lang = b.get("language").and_then(|v| v.as_str()).unwrap_or("text");

                match b_type {
                    "h1" => md.push_str(&format!("# {}\n\n", content)),
                    "h2" => md.push_str(&format!("## {}\n\n", content)),
                    "h3" => md.push_str(&format!("### {}\n\n", content)),
                    "bullet" => md.push_str(&format!("- {}\n", content)),
                    "todo" => md.push_str(&format!("- [{}] {}\n", if checked { "x" } else { " " }, content)),
                    "code" => md.push_str(&format!("```{}\n{}\n```\n\n", lang, content)),
                    "quote" => md.push_str(&format!("> {}\n\n", content)),
                    "callout" => md.push_str(&format!("> [!NOTE]\n> {}\n\n", content)),
                    "divider" => md.push_str("---\n\n"),
                    _ => md.push_str(&format!("{}\n\n", content)),
                }
            }
            return md;
        }
    }

    md.push_str(raw_content);
    md.push('\n');
    md
}

fn markdown_to_json_blocks(content: &str) -> String {
    let mut blocks = Vec::new();
    let mut in_code_block = false;
    let mut code_lang = String::new();
    let mut code_buffer = String::new();

    for line in content.lines() {
        let trimmed = line.trim();

        if trimmed.starts_with("```") {
            if in_code_block {
                blocks.push(serde_json::json!({
                    "id": Uuid::new_v4().to_string(),
                    "type": "code",
                    "content": code_buffer.trim_end(),
                    "language": if code_lang.is_empty() { "text" } else { &code_lang }
                }));
                code_buffer.clear();
                code_lang.clear();
                in_code_block = false;
            } else {
                in_code_block = true;
                code_lang = trimmed.trim_start_matches('`').trim().to_string();
            }
            continue;
        }

        if in_code_block {
            code_buffer.push_str(line);
            code_buffer.push('\n');
            continue;
        }

        if trimmed.is_empty() {
            continue;
        }

        if let Some(h1) = trimmed.strip_prefix("# ") {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "h1",
                "content": h1.trim()
            }));
        } else if let Some(h2) = trimmed.strip_prefix("## ") {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "h2",
                "content": h2.trim()
            }));
        } else if let Some(h3) = trimmed.strip_prefix("### ") {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "h3",
                "content": h3.trim()
            }));
        } else if let Some(todo) = trimmed.strip_prefix("- [x] ").or_else(|| trimmed.strip_prefix("- [X] ")) {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "todo",
                "content": todo.trim(),
                "checked": true
            }));
        } else if let Some(todo) = trimmed.strip_prefix("- [ ] ") {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "todo",
                "content": todo.trim(),
                "checked": false
            }));
        } else if let Some(bullet) = trimmed.strip_prefix("- ").or_else(|| trimmed.strip_prefix("* ")) {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "bullet",
                "content": bullet.trim()
            }));
        } else if let Some(quote) = trimmed.strip_prefix("> ") {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "quote",
                "content": quote.trim()
            }));
        } else if trimmed == "---" {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "divider",
                "content": ""
            }));
        } else {
            blocks.push(serde_json::json!({
                "id": Uuid::new_v4().to_string(),
                "type": "paragraph",
                "content": trimmed
            }));
        }
    }

    if blocks.is_empty() {
        blocks.push(serde_json::json!({
            "id": Uuid::new_v4().to_string(),
            "type": "paragraph",
            "content": ""
        }));
    }

    serde_json::to_string(&blocks).unwrap_or_else(|_| "[]".to_string())
}

#[tauri::command]
pub fn export_notes_to_folder(
    target_dir: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<NoteExportResult> {
    let dest_dir = if let Some(d) = target_dir {
        PathBuf::from(d)
    } else {
        let picked = rfd::FileDialog::new()
            .set_title("Select Folder to Export Markdown Notes")
            .pick_folder();

        match picked {
            Some(p) => p,
            None => {
                return Err(AppError::Internal("Export cancelled by user: No directory selected".to_string()));
            }
        }
    };

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| AppError::Internal(e.to_string()))?;
    }

    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, title, content_markdown, is_pinned, created_at, updated_at
         FROM notes WHERE is_archived = 0",
    )?;

    let rows = stmt.query_map([], |row| {
        let is_pinned_int: i32 = row.get(3)?;
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            is_pinned_int == 1,
            row.get::<_, String>(4)?,
            row.get::<_, String>(5)?,
        ))
    })?;

    let mut count = 0;
    for r in rows {
        let (_id, title, content, is_pinned, created_at, updated_at) = r?;
        let md = json_blocks_to_markdown(&title, &content, &created_at, &updated_at, is_pinned);
        let safe_name = sanitize_filename(&title);
        let file_path = dest_dir.join(format!("{}.md", safe_name));

        fs::write(&file_path, md).map_err(|e| AppError::Internal(format!("Failed writing note {}: {}", title, e)))?;
        count += 1;
    }

    let dest_str = dest_dir.to_string_lossy().to_string();
    Ok(NoteExportResult {
        target_directory: dest_str.clone(),
        exported_count: count,
        message: format!("Successfully exported {} notes to {}", count, dest_str),
    })
}

#[tauri::command]
pub fn import_markdown_notes(
    state: State<'_, AppState>,
) -> AppResult<NoteImportResult> {
    let picked_files = rfd::FileDialog::new()
        .set_title("Select Markdown Files to Import into Knowledge Hub")
        .add_filter("Markdown Documents", &["md", "markdown", "txt"])
        .pick_files();

    let files = match picked_files {
        Some(f) if !f.is_empty() => f,
        _ => {
            return Err(AppError::Internal("Import cancelled: No files selected".to_string()));
        }
    };

    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut imported_titles = Vec::new();

    for file_path in files {
        if let Ok(raw) = fs::read_to_string(&file_path) {
            let filename = file_path
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("Imported Note");

            let mut title = filename.replace('_', " ");
            let mut body = raw.as_str();

            // Parse optional frontmatter
            if raw.starts_with("---") {
                if let Some(end_idx) = raw[3..].find("---") {
                    let frontmatter = &raw[3..3 + end_idx];
                    body = raw[3 + end_idx + 3..].trim_start();

                    for line in frontmatter.lines() {
                        let t = line.trim();
                        if let Some(fm_title) = t.strip_prefix("title:") {
                            let clean = fm_title.trim().trim_matches('"').trim_matches('\'');
                            if !clean.is_empty() {
                                title = clean.to_string();
                            }
                        }
                    }
                }
            }

            let blocks_json = markdown_to_json_blocks(body);
            let id = Uuid::new_v4().to_string();

            conn.execute(
                "INSERT INTO notes (id, title, content_markdown, is_pinned, is_archived, created_at, updated_at)
                 VALUES (?1, ?2, ?3, 0, 0, datetime('now'), datetime('now'))",
                rusqlite::params![&id, &title, &blocks_json],
            )?;

            imported_titles.push(title);
        }
    }

    let count = imported_titles.len();
    Ok(NoteImportResult {
        imported_count: count,
        imported_titles,
        message: format!("Successfully imported {} markdown document(s) into Knowledge Hub", count),
    })
}
