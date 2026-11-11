use chrono::{Duration, Local};
use rusqlite::params;
use std::collections::HashMap;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::models::analytics::{AnalyticsOverview, DailyVelocity, DsaTopicMastery, HeatmapDay};
use crate::state::AppState;

#[tauri::command]
pub fn get_analytics_overview(
    days_back: Option<i64>,
    state: State<'_, AppState>,
) -> AppResult<AnalyticsOverview> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // 1. High-level aggregates
    let total_study_minutes: i64 = conn.query_row(
        "SELECT COALESCE(SUM(duration_minutes), 0) FROM study_sessions",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    let weekly_study_minutes: i64 = conn.query_row(
        "SELECT COALESCE(SUM(duration_minutes), 0) FROM study_sessions WHERE start_time >= date('now', '-7 days')",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    let total_tasks_completed: i64 = conn.query_row(
        "SELECT COUNT(*) FROM tasks WHERE status = 'done'",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    let total_habits_completed: i64 = conn.query_row(
        "SELECT COUNT(*) FROM habit_logs WHERE completed = 1",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    let total_dsa_solved: i64 = conn.query_row(
        "SELECT COUNT(*) FROM dsa_problems WHERE independent_solve = 1 OR confidence_score >= 4",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    let current_streak_days: i64 = conn.query_row(
        "SELECT COALESCE(MAX(streak), 0) FROM habits",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    // 2. Fetch daily activities for heatmap
    let days_count = days_back.unwrap_or(180).clamp(30, 365);
    let today = Local::now().date_naive();
    let start_date = today - Duration::days(days_count - 1);
    let start_date_str = start_date.format("%Y-%m-%d").to_string();

    // Map of date string -> (tasks, habits, study_minutes, dsa)
    let mut day_data: HashMap<String, (i64, i64, i64, i64)> = HashMap::new();

    // Tasks completed by date
    {
        let mut stmt = conn.prepare(
            "SELECT substr(updated_at, 1, 10) as d, COUNT(*) 
             FROM tasks 
             WHERE status = 'done' AND substr(updated_at, 1, 10) >= ?1 
             GROUP BY d",
        )?;
        let mut rows = stmt.query(params![start_date_str])?;
        while let Some(r) = rows.next()? {
            let date: String = r.get(0)?;
            let count: i64 = r.get(1)?;
            let entry = day_data.entry(date).or_insert((0, 0, 0, 0));
            entry.0 = count;
        }
    }

    // Habits logged by date
    {
        let mut stmt = conn.prepare(
            "SELECT date, COUNT(*) 
             FROM habit_logs 
             WHERE completed = 1 AND date >= ?1 
             GROUP BY date",
        )?;
        let mut rows = stmt.query(params![start_date_str])?;
        while let Some(r) = rows.next()? {
            let date: String = r.get(0)?;
            let count: i64 = r.get(1)?;
            let entry = day_data.entry(date).or_insert((0, 0, 0, 0));
            entry.1 = count;
        }
    }

    // Study minutes by date
    {
        let mut stmt = conn.prepare(
            "SELECT substr(start_time, 1, 10) as d, SUM(duration_minutes) 
             FROM study_sessions 
             WHERE substr(start_time, 1, 10) >= ?1 
             GROUP BY d",
        )?;
        let mut rows = stmt.query(params![start_date_str])?;
        while let Some(r) = rows.next()? {
            let date: String = r.get(0)?;
            let count: i64 = r.get(1)?;
            let entry = day_data.entry(date).or_insert((0, 0, 0, 0));
            entry.2 = count;
        }
    }

    // Build continuous array of HeatmapDay
    let mut heatmap_days = Vec::new();
    for i in 0..days_count {
        let current_date = start_date + Duration::days(i);
        let date_str = current_date.format("%Y-%m-%d").to_string();
        let (tasks, habits, study_mins, dsa) = day_data.get(&date_str).copied().unwrap_or((0, 0, 0, 0));
        let total_activity_points = tasks * 2 + habits + (study_mins / 25) + dsa * 3;
        
        let level = match total_activity_points {
            0 => 0,
            1..=2 => 1,
            3..=5 => 2,
            6..=9 => 3,
            _ => 4,
        };

        heatmap_days.push(HeatmapDay {
            date: date_str,
            count: total_activity_points,
            level,
            tasks_completed: tasks,
            habits_completed: habits,
            study_minutes: study_mins,
            dsa_solved: dsa,
        });
    }

    // 3. DSA Topic Mastery stats
    let mut dsa_topics = Vec::new();
    {
        let mut stmt = conn.prepare(
            "SELECT t.id, t.name,
                    (SELECT COUNT(*) FROM dsa_problems p WHERE p.topic_id = t.id AND (p.independent_solve = 1 OR p.confidence_score >= 4)) as solved,
                    (SELECT COUNT(*) FROM dsa_problems p WHERE p.topic_id = t.id) as total
             FROM dsa_topics t
             ORDER BY t.sort_order ASC",
        )?;
        let mut rows = stmt.query([])?;
        while let Some(r) = rows.next()? {
            let solved: i64 = r.get(2)?;
            let total: i64 = r.get(3)?;
            let percentage = if total > 0 {
                ((solved as f64) / (total as f64) * 100.0).round()
            } else {
                0.0
            };

            dsa_topics.push(DsaTopicMastery {
                topic_id: r.get(0)?,
                topic_name: r.get(1)?,
                solved,
                total: if total == 0 { 10 } else { total },
                percentage,
            });
        }
    }

    // 4. Past 7 Days Weekly Velocity
    let mut weekly_velocity = Vec::new();
    for i in (0..7).rev() {
        let cur_date = today - Duration::days(i);
        let date_str = cur_date.format("%Y-%m-%d").to_string();
        let day_name = cur_date.format("%a").to_string(); // Mon, Tue, etc.
        let (tasks, habits, study_mins, _) = day_data.get(&date_str).copied().unwrap_or((0, 0, 0, 0));
        let study_hours = ((study_mins as f64) / 60.0 * 10.0).round() / 10.0;

        weekly_velocity.push(DailyVelocity {
            day_name,
            date: date_str,
            study_hours,
            tasks_completed: tasks,
            habits_completed: habits,
        });
    }

    Ok(AnalyticsOverview {
        total_study_minutes,
        weekly_study_minutes,
        total_tasks_completed,
        total_habits_completed,
        total_dsa_solved,
        current_streak_days,
        heatmap_days,
        dsa_topics,
        weekly_velocity,
    })
}
