use rusqlite::params;
use tauri::State;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::snippet::{CreateSnippetInput, SnippetItem, UpdateSnippetInput};
use crate::state::AppState;

fn parse_tags(raw_tags: Option<String>) -> Vec<String> {
    raw_tags
        .map(|t| {
            t.split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
pub fn get_snippets(
    category: Option<String>,
    search: Option<String>,
    favorites_only: Option<bool>,
    state: State<'_, AppState>,
) -> AppResult<Vec<SnippetItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let cat_filter = category.unwrap_or_else(|| "all".to_string()).to_lowercase();
    let q = search.unwrap_or_default().trim().to_lowercase();
    let fav = favorites_only.unwrap_or(false);

    let sql = "SELECT id, title, description, code, language, category, tags, is_favorite, usage_count, created_at, updated_at
               FROM snippets
               ORDER BY is_favorite DESC, usage_count DESC, updated_at DESC";

    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map([], |row| {
        let is_fav_int: i64 = row.get(7)?;
        let raw_tags: Option<String> = row.get(6)?;

        Ok(SnippetItem {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            code: row.get(3)?,
            language: row.get(4)?,
            category: row.get(5)?,
            tags: parse_tags(raw_tags),
            is_favorite: is_fav_int == 1,
            usage_count: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    })?;

    let mut snippets = Vec::new();
    for r in rows {
        let s = r?;

        // Filter by favorites
        if fav && !s.is_favorite {
            continue;
        }

        // Filter by category
        if cat_filter != "all" && s.category.to_lowercase() != cat_filter {
            continue;
        }

        // Filter by search query
        if !q.is_empty() {
            let title_match = s.title.to_lowercase().contains(&q);
            let desc_match = s.description.as_deref().unwrap_or("").to_lowercase().contains(&q);
            let code_match = s.code.to_lowercase().contains(&q);
            let lang_match = s.language.to_lowercase().contains(&q);
            let tag_match = s.tags.iter().any(|t| t.to_lowercase().contains(&q));

            if !title_match && !desc_match && !code_match && !lang_match && !tag_match {
                continue;
            }
        }

        snippets.push(s);
    }

    Ok(snippets)
}

#[tauri::command]
pub fn create_snippet(
    input: CreateSnippetInput,
    state: State<'_, AppState>,
) -> AppResult<SnippetItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = format!("snip-{}", Uuid::new_v4());
    let title = input.title.trim().to_string();
    let code = input.code.trim().to_string();
    let language = input.language.unwrap_or_else(|| "bash".to_string()).to_lowercase();
    let category = input.category.unwrap_or_else(|| "general".to_string()).to_lowercase();
    let tags_str = input.tags.clone().unwrap_or_default();
    let is_fav = if input.is_favorite.unwrap_or(false) { 1 } else { 0 };

    conn.execute(
        "INSERT INTO snippets (id, title, description, code, language, category, tags, is_favorite, usage_count, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, datetime('now'), datetime('now'))",
        params![
            &id,
            &title,
            input.description.as_deref().map(str::trim),
            &code,
            &language,
            &category,
            &tags_str,
            is_fav,
        ],
    )?;

    Ok(SnippetItem {
        id,
        title,
        description: input.description,
        code,
        language,
        category,
        tags: parse_tags(Some(tags_str)),
        is_favorite: is_fav == 1,
        usage_count: 0,
        created_at: chrono::Utc::now().to_rfc3339(),
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn update_snippet(
    input: UpdateSnippetInput,
    state: State<'_, AppState>,
) -> AppResult<SnippetItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let title = input.title.trim().to_string();
    let code = input.code.trim().to_string();
    let language = input.language.unwrap_or_else(|| "bash".to_string()).to_lowercase();
    let category = input.category.unwrap_or_else(|| "general".to_string()).to_lowercase();
    let tags_str = input.tags.clone().unwrap_or_default();
    let is_fav = if input.is_favorite.unwrap_or(false) { 1 } else { 0 };

    conn.execute(
        "UPDATE snippets
         SET title = ?1, description = ?2, code = ?3, language = ?4, category = ?5, tags = ?6, is_favorite = ?7, updated_at = datetime('now')
         WHERE id = ?8",
        params![
            &title,
            input.description.as_deref().map(str::trim),
            &code,
            &language,
            &category,
            &tags_str,
            is_fav,
            &input.id,
        ],
    )?;

    // Fetch updated
    let mut stmt = conn.prepare(
        "SELECT id, title, description, code, language, category, tags, is_favorite, usage_count, created_at, updated_at
         FROM snippets WHERE id = ?1",
    )?;

    let snippet = stmt.query_row(params![&input.id], |row| {
        let fav_int: i64 = row.get(7)?;
        let raw_tags: Option<String> = row.get(6)?;

        Ok(SnippetItem {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            code: row.get(3)?,
            language: row.get(4)?,
            category: row.get(5)?,
            tags: parse_tags(raw_tags),
            is_favorite: fav_int == 1,
            usage_count: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    })?;

    Ok(snippet)
}

#[tauri::command]
pub fn toggle_snippet_favorite(id: String, state: State<'_, AppState>) -> AppResult<bool> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    conn.execute(
        "UPDATE snippets
         SET is_favorite = CASE WHEN is_favorite = 1 THEN 0 ELSE 1 END, updated_at = datetime('now')
         WHERE id = ?1",
        params![&id],
    )?;

    let mut stmt = conn.prepare("SELECT is_favorite FROM snippets WHERE id = ?1")?;
    let is_fav: i64 = stmt.query_row(params![&id], |row| row.get(0))?;

    Ok(is_fav == 1)
}

#[tauri::command]
pub fn increment_snippet_usage(id: String, state: State<'_, AppState>) -> AppResult<i64> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    conn.execute(
        "UPDATE snippets
         SET usage_count = usage_count + 1, updated_at = datetime('now')
         WHERE id = ?1",
        params![&id],
    )?;

    let mut stmt = conn.prepare("SELECT usage_count FROM snippets WHERE id = ?1")?;
    let count: i64 = stmt.query_row(params![&id], |row| row.get(0))?;

    Ok(count)
}

#[tauri::command]
pub fn delete_snippet(id: String, state: State<'_, AppState>) -> AppResult<bool> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let affected = conn.execute("DELETE FROM snippets WHERE id = ?1", params![&id])?;
    Ok(affected > 0)
}

#[tauri::command]
pub fn export_snippets_json(state: State<'_, AppState>) -> AppResult<String> {
    let snippets = get_snippets(None, None, None, state)?;
    let json = serde_json::to_string_pretty(&snippets)
        .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(json)
}
