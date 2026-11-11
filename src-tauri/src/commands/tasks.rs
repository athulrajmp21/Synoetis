use tauri::State;
use uuid::Uuid;
use crate::error::{AppError, AppResult};
use crate::models::task::{CreateTaskInput, Task};
use crate::state::AppState;

#[tauri::command]
pub fn get_tasks(state: State<'_, AppState>) -> AppResult<Vec<Task>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT id, title, description, priority, status, due_date, category, 
                project_id, goal_id, course_id, is_recurring, recurrence_rule, 
                created_at, updated_at 
         FROM tasks 
         ORDER BY 
            CASE status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 ELSE 3 END,
            CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
            created_at DESC"
    )?;

    let rows = stmt.query_map([], |row| {
        let is_recurring_int: i32 = row.get(10)?;
        Ok(Task {
            id: row.get(0)?,
            title: row.get(1)?,
            description: row.get(2)?,
            priority: row.get(3)?,
            status: row.get(4)?,
            due_date: row.get(5)?,
            category: row.get(6)?,
            project_id: row.get(7)?,
            goal_id: row.get(8)?,
            course_id: row.get(9)?,
            is_recurring: is_recurring_int == 1,
            recurrence_rule: row.get(11)?,
            created_at: row.get(12)?,
            updated_at: row.get(13)?,
        })
    })?;

    let mut tasks = Vec::new();
    for r in rows {
        tasks.push(r?);
    }
    Ok(tasks)
}

#[tauri::command]
pub fn create_task(input: CreateTaskInput, state: State<'_, AppState>) -> AppResult<Task> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = Uuid::new_v4().to_string();
    let priority = input.priority.unwrap_or_else(|| "medium".to_string());
    let category = input.category.unwrap_or_else(|| "general".to_string());

    conn.execute(
        "INSERT INTO tasks (id, title, description, priority, status, due_date, category, project_id, is_recurring)
         VALUES (?1, ?2, ?3, ?4, 'todo', ?5, ?6, ?7, 0)",
        rusqlite::params![
            &id,
            &input.title,
            &input.description,
            &priority,
            &input.due_date,
            &category,
            &input.project_id
        ],
    )?;

    let task = conn.query_row(
        "SELECT id, title, description, priority, status, due_date, category, 
                project_id, goal_id, course_id, is_recurring, recurrence_rule, 
                created_at, updated_at 
         FROM tasks WHERE id = ?1",
        [&id],
        |row| {
            let is_recurring_int: i32 = row.get(10)?;
            Ok(Task {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                priority: row.get(3)?,
                status: row.get(4)?,
                due_date: row.get(5)?,
                category: row.get(6)?,
                project_id: row.get(7)?,
                goal_id: row.get(8)?,
                course_id: row.get(9)?,
                is_recurring: is_recurring_int == 1,
                recurrence_rule: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        },
    )?;

    Ok(task)
}

#[tauri::command]
pub fn update_task_status(id: String, status: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute(
        "UPDATE tasks SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
        [&status, &id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_task(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM tasks WHERE id = ?1", [&id])?;
    Ok(())
}
