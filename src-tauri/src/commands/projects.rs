use rusqlite::params;
use tauri::State;
use uuid::Uuid;
use crate::error::{AppError, AppResult};
use crate::models::project::{CreateProjectInput, ProjectItem};
use crate::state::AppState;

#[tauri::command]
pub fn get_projects(state: State<'_, AppState>) -> AppResult<Vec<ProjectItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let mut stmt = conn.prepare(
        "SELECT id, title, description, tech_stack, repo_url, live_url, status, priority
         FROM projects ORDER BY updated_at DESC",
    )?;

    let rows = stmt.query_map([], |row| {
        let raw_tech: Option<String> = row.get(3)?;
        let tech_stack = raw_tech
            .map(|t| {
                t.split(',')
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect()
            })
            .unwrap_or_default();

        Ok(ProjectItem {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            tech_stack,
            repo_url: row.get(4)?,
            live_url: row.get(5)?,
            status: row.get(6)?,
            priority: row.get(7)?,
        })
    })?;

    let mut projects = Vec::new();
    for r in rows {
        projects.push(r?);
    }

    Ok(projects)
}

#[tauri::command]
pub fn create_project(input: CreateProjectInput, state: State<'_, AppState>) -> AppResult<ProjectItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = Uuid::new_v4().to_string();
    let status = input.status.unwrap_or_else(|| "active".to_string());
    let priority = input.priority.unwrap_or_else(|| "medium".to_string());
    let tech_stack_str = input.tech_stack.clone().unwrap_or_default();

    conn.execute(
        "INSERT INTO projects (id, title, description, tech_stack, repo_url, live_url, status, priority, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'), datetime('now'))",
        params![
            &id,
            input.title.trim(),
            input.description.as_deref().map(str::trim),
            &tech_stack_str,
            input.repo_url.as_deref().map(str::trim),
            input.live_url.as_deref().map(str::trim),
            &status,
            &priority,
        ],
    )?;

    let tech_stack: Vec<String> = tech_stack_str
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    Ok(ProjectItem {
        id,
        title: input.title.trim().to_string(),
        description: input.description.map(|d| d.trim().to_string()),
        tech_stack,
        repo_url: input.repo_url.map(|r| r.trim().to_string()),
        live_url: input.live_url.map(|l| l.trim().to_string()),
        status,
        priority,
    })
}

#[tauri::command]
pub fn update_project_status(id: String, status: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute(
        "UPDATE projects SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![status, id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_project(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])?;
    Ok(())
}
