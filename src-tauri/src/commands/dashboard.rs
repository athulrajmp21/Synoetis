use tauri::State;
use crate::error::{AppError, AppResult};
use crate::models::dashboard::DashboardStats;
use crate::state::AppState;

#[tauri::command]
pub fn get_dashboard_stats(state: State<'_, AppState>) -> AppResult<DashboardStats> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let pending_tasks_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM tasks WHERE status != 'done' AND status != 'canceled'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let active_projects_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM projects WHERE status = 'active'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let dsa_solved_count: i64 = conn.query_row(
        "SELECT COUNT(DISTINCT problem_id) FROM dsa_attempts WHERE success = 1",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let current_semester: String = conn.query_row(
        "SELECT name FROM semesters WHERE status = 'active' LIMIT 1",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "Semester 4 (Spring)".to_string());

    let weekly_study_minutes: i64 = conn.query_row(
        "SELECT COALESCE(SUM(duration_minutes), 0) FROM study_sessions 
         WHERE date(start_time) >= date('now', '-7 days')",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let active_goals_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM goals WHERE status = 'in_progress'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let upcoming_assessments_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM assessments WHERE status = 'pending'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    Ok(DashboardStats {
        pending_tasks_count,
        active_projects_count,
        dsa_solved_count,
        current_semester,
        weekly_study_hours: (weekly_study_minutes as f64) / 60.0,
        active_goals_count,
        upcoming_assessments_count,
    })
}
