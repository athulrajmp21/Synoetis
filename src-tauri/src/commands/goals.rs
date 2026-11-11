use rusqlite::params;
use tauri::State;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::goal::{
    CreateGoalInput, CreateMilestoneInput, GoalItem, MilestoneItem, UpdateGoalInput,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_goals(
    timeframe: Option<String>,
    category: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<Vec<GoalItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let mut query = String::from(
        "SELECT g.id, g.title, g.description, g.category, g.timeframe, g.target_date, 
                g.progress, g.status, g.created_at, g.updated_at,
                (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id) AS milestones_count,
                (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id AND m.is_completed = 1) AS completed_milestones_count
         FROM goals g
         WHERE 1=1"
    );

    let mut param_values: Vec<String> = Vec::new();

    if let Some(ref tf) = timeframe {
        if tf != "all" {
            param_values.push(tf.clone());
            query.push_str(&format!(" AND g.timeframe = ?{}", param_values.len()));
        }
    }

    if let Some(ref cat) = category {
        if cat != "all" {
            param_values.push(cat.clone());
            query.push_str(&format!(" AND g.category = ?{}", param_values.len()));
        }
    }

    query.push_str(" ORDER BY CASE WHEN g.status = 'in_progress' THEN 0 WHEN g.status = 'completed' THEN 1 ELSE 2 END, g.target_date ASC, g.created_at DESC");

    let mut stmt = conn.prepare(&query)?;
    let mut rows = match param_values.len() {
        0 => stmt.query([])?,
        1 => stmt.query(params![param_values[0]])?,
        2 => stmt.query(params![param_values[0], param_values[1]])?,
        _ => stmt.query([])?,
    };

    let mut goals = Vec::new();
    while let Some(row) = rows.next()? {
        goals.push(GoalItem {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            category: row.get(3)?,
            timeframe: row.get(4)?,
            target_date: row.get(5)?,
            progress: row.get(6)?,
            status: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            milestones_count: row.get(10)?,
            completed_milestones_count: row.get(11)?,
        });
    }

    Ok(goals)
}

#[tauri::command]
pub fn create_goal(input: CreateGoalInput, state: State<'_, AppState>) -> AppResult<GoalItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let goal_id = format!("goal-{}", Uuid::new_v4());

    conn.execute(
        "INSERT INTO goals (id, title, description, category, timeframe, target_date, progress, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0.0, 'in_progress')",
        params![
            goal_id,
            input.title,
            input.description,
            input.category,
            input.timeframe,
            input.target_date,
        ],
    )?;

    // Insert any initial milestones passed with the creation payload
    if let Some(milestones) = input.initial_milestones {
        for title in milestones {
            let trimmed = title.trim();
            if !trimmed.is_empty() {
                let ms_id = format!("ms-{}", Uuid::new_v4());
                conn.execute(
                    "INSERT INTO milestones (id, goal_id, title, is_completed) VALUES (?1, ?2, ?3, 0)",
                    params![ms_id, goal_id, trimmed],
                )?;
            }
        }
    }

    let mut stmt = conn.prepare(
        "SELECT g.id, g.title, g.description, g.category, g.timeframe, g.target_date, 
                g.progress, g.status, g.created_at, g.updated_at,
                (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id) AS milestones_count,
                (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id AND m.is_completed = 1) AS completed_milestones_count
         FROM goals g WHERE g.id = ?1",
    )?;

    let goal = stmt.query_row(params![goal_id], |row| {
        Ok(GoalItem {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            category: row.get(3)?,
            timeframe: row.get(4)?,
            target_date: row.get(5)?,
            progress: row.get(6)?,
            status: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            milestones_count: row.get(10)?,
            completed_milestones_count: row.get(11)?,
        })
    })?;

    Ok(goal)
}

#[tauri::command]
pub fn update_goal(
    id: String,
    input: UpdateGoalInput,
    state: State<'_, AppState>,
) -> AppResult<GoalItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    if let Some(ref title) = input.title {
        conn.execute("UPDATE goals SET title = ?1 WHERE id = ?2", params![title, id])?;
    }
    if let Some(ref desc) = input.description {
        conn.execute("UPDATE goals SET description = ?1 WHERE id = ?2", params![desc, id])?;
    }
    if let Some(ref cat) = input.category {
        conn.execute("UPDATE goals SET category = ?1 WHERE id = ?2", params![cat, id])?;
    }
    if let Some(ref tf) = input.timeframe {
        conn.execute("UPDATE goals SET timeframe = ?1 WHERE id = ?2", params![tf, id])?;
    }
    if let Some(ref td) = input.target_date {
        conn.execute("UPDATE goals SET target_date = ?1 WHERE id = ?2", params![td, id])?;
    }
    if let Some(prog) = input.progress {
        conn.execute("UPDATE goals SET progress = ?1 WHERE id = ?2", params![prog, id])?;
    }
    if let Some(ref status) = input.status {
        conn.execute("UPDATE goals SET status = ?1 WHERE id = ?2", params![status, id])?;
    }

    conn.execute(
        "UPDATE goals SET updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )?;

    let mut stmt = conn.prepare(
        "SELECT g.id, g.title, g.description, g.category, g.timeframe, g.target_date, 
                g.progress, g.status, g.created_at, g.updated_at,
                (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id) AS milestones_count,
                (SELECT COUNT(*) FROM milestones m WHERE m.goal_id = g.id AND m.is_completed = 1) AS completed_milestones_count
         FROM goals g WHERE g.id = ?1",
    )?;

    let goal = stmt.query_row(params![id], |row| {
        Ok(GoalItem {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            category: row.get(3)?,
            timeframe: row.get(4)?,
            target_date: row.get(5)?,
            progress: row.get(6)?,
            status: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
            milestones_count: row.get(10)?,
            completed_milestones_count: row.get(11)?,
        })
    })?;

    Ok(goal)
}

#[tauri::command]
pub fn update_goal_progress(
    id: String,
    progress: f64,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let clamped_prog = progress.clamp(0.0, 100.0);
    let new_status = if clamped_prog >= 100.0 { "completed" } else { "in_progress" };

    conn.execute(
        "UPDATE goals SET progress = ?1, status = CASE WHEN status = 'archived' THEN 'archived' ELSE ?2 END, updated_at = datetime('now') WHERE id = ?3",
        params![clamped_prog, new_status, id],
    )?;

    Ok(())
}

#[tauri::command]
pub fn update_goal_status(
    id: String,
    status: String,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let progress_adjustment = if status == "completed" { 100.0 } else { -1.0 };

    if progress_adjustment >= 0.0 {
        conn.execute(
            "UPDATE goals SET status = ?1, progress = ?2, updated_at = datetime('now') WHERE id = ?3",
            params![status, progress_adjustment, id],
        )?;
    } else {
        conn.execute(
            "UPDATE goals SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
            params![status, id],
        )?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_goal(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM milestones WHERE goal_id = ?1", params![id])?;
    conn.execute("DELETE FROM goals WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn get_milestones(
    goal_id: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<Vec<MilestoneItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let mut query = String::from(
        "SELECT id, goal_id, project_id, title, due_date, is_completed, created_at, updated_at
         FROM milestones WHERE 1=1"
    );

    if goal_id.is_some() {
        query.push_str(" AND goal_id = ?1");
    }

    query.push_str(" ORDER BY is_completed ASC, due_date ASC, created_at ASC");

    let mut stmt = conn.prepare(&query)?;
    let mut rows = match goal_id {
        Some(ref gid) => stmt.query(params![gid])?,
        None => stmt.query([])?,
    };

    let mut milestones = Vec::new();
    while let Some(row) = rows.next()? {
        let is_completed_int: i64 = row.get(5)?;
        milestones.push(MilestoneItem {
            id: row.get(0)?,
            goal_id: row.get(1)?,
            project_id: row.get(2)?,
            title: row.get(3)?,
            due_date: row.get(4)?,
            is_completed: is_completed_int == 1,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        });
    }

    Ok(milestones)
}

#[tauri::command]
pub fn create_milestone(
    input: CreateMilestoneInput,
    state: State<'_, AppState>,
) -> AppResult<MilestoneItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let milestone_id = format!("ms-{}", Uuid::new_v4());

    conn.execute(
        "INSERT INTO milestones (id, goal_id, project_id, title, due_date, is_completed)
         VALUES (?1, ?2, ?3, ?4, ?5, 0)",
        params![
            milestone_id,
            input.goal_id,
            input.project_id,
            input.title,
            input.due_date,
        ],
    )?;

    // Recalculate parent goal progress if linked
    if let Some(ref gid) = input.goal_id {
        recalculate_goal_progress(&conn, gid)?;
    }

    let mut stmt = conn.prepare(
        "SELECT id, goal_id, project_id, title, due_date, is_completed, created_at, updated_at
         FROM milestones WHERE id = ?1",
    )?;

    let item = stmt.query_row(params![milestone_id], |row| {
        let is_comp_int: i64 = row.get(5)?;
        Ok(MilestoneItem {
            id: row.get(0)?,
            goal_id: row.get(1)?,
            project_id: row.get(2)?,
            title: row.get(3)?,
            due_date: row.get(4)?,
            is_completed: is_comp_int == 1,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
        })
    })?;

    Ok(item)
}

#[tauri::command]
pub fn toggle_milestone(id: String, state: State<'_, AppState>) -> AppResult<bool> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let (current_status, goal_id): (i64, Option<String>) = conn.query_row(
        "SELECT is_completed, goal_id FROM milestones WHERE id = ?1",
        params![id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    let new_status = if current_status == 1 { 0 } else { 1 };

    conn.execute(
        "UPDATE milestones SET is_completed = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![new_status, id],
    )?;

    if let Some(ref gid) = goal_id {
        recalculate_goal_progress(&conn, gid)?;
    }

    Ok(new_status == 1)
}

#[tauri::command]
pub fn delete_milestone(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let goal_id: Option<String> = conn
        .query_row(
            "SELECT goal_id FROM milestones WHERE id = ?1",
            params![id],
            |row| row.get(0),
        )
        .ok();

    conn.execute("DELETE FROM milestones WHERE id = ?1", params![id])?;

    if let Some(ref gid) = goal_id {
        recalculate_goal_progress(&conn, gid)?;
    }

    Ok(())
}

fn recalculate_goal_progress(conn: &rusqlite::Connection, goal_id: &str) -> AppResult<()> {
    let (total, completed): (i64, i64) = conn.query_row(
        "SELECT COUNT(*), COUNT(CASE WHEN is_completed = 1 THEN 1 END) 
         FROM milestones WHERE goal_id = ?1",
        params![goal_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )?;

    if total > 0 {
        let progress = ((completed as f64) / (total as f64) * 100.0).round();
        let status = if progress >= 100.0 {
            "completed"
        } else {
            "in_progress"
        };

        conn.execute(
            "UPDATE goals SET progress = ?1, status = CASE WHEN status = 'archived' THEN 'archived' ELSE ?2 END, updated_at = datetime('now') WHERE id = ?3",
            params![progress, status, goal_id],
        )?;
    }

    Ok(())
}
