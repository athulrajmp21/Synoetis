use tauri::State;
use uuid::Uuid;
use chrono::Local;
use crate::error::{AppError, AppResult};
use crate::models::habit::{CreateHabitInput, HabitItem};
use crate::state::AppState;

#[tauri::command]
pub fn get_habits(state: State<'_, AppState>) -> AppResult<Vec<HabitItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let today = Local::now().format("%Y-%m-%d").to_string();

    let mut stmt = conn.prepare(
        "SELECT h.id, h.title, h.category, h.frequency,
                (SELECT COUNT(*) FROM habit_logs hl WHERE hl.habit_id = h.id AND hl.completed = 1) as total_logged,
                EXISTS(SELECT 1 FROM habit_logs hl WHERE hl.habit_id = h.id AND hl.date = ?1 AND hl.completed = 1) as is_done_today
         FROM habits h
         WHERE h.is_active = 1
         ORDER BY h.created_at ASC"
    )?;

    let rows = stmt.query_map([&today], |row| {
        let total_logged: i64 = row.get(4)?;
        let is_done_int: i32 = row.get(5)?;
        Ok(HabitItem {
            id: row.get(0)?,
            title: row.get(1)?,
            category: row.get(2)?,
            frequency: row.get(3)?,
            streak: total_logged,
            is_completed_today: is_done_int == 1,
        })
    })?;

    let mut habits = Vec::new();
    for r in rows {
        habits.push(r?);
    }
    Ok(habits)
}

#[tauri::command]
pub fn create_habit(input: CreateHabitInput, state: State<'_, AppState>) -> AppResult<HabitItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = Uuid::new_v4().to_string();
    let category = input.category.unwrap_or_else(|| "productivity".to_string());

    conn.execute(
        "INSERT INTO habits (id, title, category, frequency, target_per_day, is_active)
         VALUES (?1, ?2, ?3, 'daily', 1, 1)",
        rusqlite::params![&id, &input.title, &category],
    )?;

    Ok(HabitItem {
        id,
        title: input.title,
        category,
        frequency: "daily".to_string(),
        streak: 0,
        is_completed_today: false,
    })
}

#[tauri::command]
pub fn toggle_habit_today(habit_id: String, state: State<'_, AppState>) -> AppResult<bool> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let today = Local::now().format("%Y-%m-%d").to_string();

    let exists: bool = conn.query_row(
        "SELECT EXISTS(SELECT 1 FROM habit_logs WHERE habit_id = ?1 AND date = ?2 AND completed = 1)",
        rusqlite::params![&habit_id, &today],
        |row| row.get(0),
    ).unwrap_or(false);

    if exists {
        conn.execute(
            "DELETE FROM habit_logs WHERE habit_id = ?1 AND date = ?2",
            rusqlite::params![&habit_id, &today],
        )?;
        Ok(false)
    } else {
        let log_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO habit_logs (id, habit_id, date, count, completed)
             VALUES (?1, ?2, ?3, 1, 1)
             ON CONFLICT(habit_id, date) DO UPDATE SET completed = 1",
            rusqlite::params![&log_id, &habit_id, &today],
        )?;
        Ok(true)
    }
}

#[tauri::command]
pub fn delete_habit(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM habits WHERE id = ?1", [&id])?;
    Ok(())
}
