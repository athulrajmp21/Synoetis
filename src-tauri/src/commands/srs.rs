use rusqlite::params;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::models::srs::{SrsItem, SrsOverview, SubmitSrsReviewInput};
use crate::state::AppState;

fn clean_text_preview(text: &str, max_len: usize) -> String {
    let cleaned = if text.trim_start().starts_with('[') && text.contains("\"content\"") {
        let mut extracted = String::new();
        for part in text.split("\"content\":") {
            if let Some(end) = part.find("\",\"") {
                let s = part[..end].trim_matches('"').trim();
                if !s.is_empty() {
                    extracted.push_str(s);
                    extracted.push(' ');
                }
            }
        }
        if extracted.is_empty() { text.to_string() } else { extracted }
    } else {
        text.replace(['\n', '\r', '#', '*', '`', '>'], " ")
    };

    let trimmed = cleaned.split_whitespace().collect::<Vec<_>>().join(" ");
    if trimmed.chars().count() > max_len {
        format!("{}...", trimmed.chars().take(max_len).collect::<String>())
    } else {
        trimmed
    }
}

#[tauri::command]
pub fn get_srs_overview(state: State<'_, AppState>) -> AppResult<SrsOverview> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // Auto-enroll any solved DSA problems not yet in SRS queue
    let _ = conn.execute(
        "INSERT OR IGNORE INTO srs_items (id, item_type, item_id, next_review_date, review_stage, ease_factor, review_count, created_at, updated_at)
         SELECT 'srs-dsa-' || id, 'dsa', id, date('now'), 1, 2.5, 0, datetime('now'), datetime('now')
         FROM dsa_problems WHERE status = 'solved'",
        [],
    );

    let total_items: i64 = conn.query_row(
        "SELECT COUNT(*) FROM srs_items",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let due_today_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM srs_items WHERE date(next_review_date) <= date('now')",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let mastered_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM srs_items WHERE review_stage >= 5",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let learning_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM srs_items WHERE review_stage < 5",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    // Fetch all items due today or overdue
    let mut stmt = conn.prepare(
        "SELECT id, item_type, item_id, next_review_date, review_stage, ease_factor, review_count, last_reviewed_at
         FROM srs_items
         WHERE date(next_review_date) <= date('now')
         ORDER BY date(next_review_date) ASC, review_stage ASC
         LIMIT 50",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok((
            row.get::<_, String>(0)?,
            row.get::<_, String>(1)?,
            row.get::<_, String>(2)?,
            row.get::<_, String>(3)?,
            row.get::<_, i64>(4)?,
            row.get::<_, f64>(5)?,
            row.get::<_, i64>(6)?,
            row.get::<_, Option<String>>(7)?,
        ))
    })?;

    let mut due_items = Vec::new();
    for r in rows {
        let (id, item_type, item_id, next_review_date, review_stage, ease_factor, review_count, last_reviewed_at) = r?;

        if item_type == "dsa" {
            let mut dsa_stmt = conn.prepare(
                "SELECT title, difficulty, platform, code_snippet, notes
                 FROM dsa_problems WHERE id = ?1",
            )?;
            if let Ok(dsa_info) = dsa_stmt.query_row(params![&item_id], |row| {
                let title: String = row.get(0)?;
                let diff: String = row.get(1)?;
                let plat: String = row.get(2)?;
                let code: Option<String> = row.get(3)?;
                let notes: Option<String> = row.get(4)?;
                Ok((title, diff, plat, code, notes))
            }) {
                let (title, difficulty, platform, code_snippet, notes) = dsa_info;
                let preview = code_snippet.or(notes).map(|t| clean_text_preview(&t, 160));

                due_items.push(SrsItem {
                    id,
                    item_type: "dsa".to_string(),
                    item_id,
                    title,
                    subtitle: Some(format!("{} • Review Interval Stage {}", platform.to_uppercase(), review_stage)),
                    content_preview: preview,
                    difficulty: Some(difficulty),
                    tags: vec![platform],
                    next_review_date,
                    review_stage,
                    ease_factor,
                    review_count,
                    last_reviewed_at,
                    is_overdue: true,
                });
            }
        } else if item_type == "note" {
            let mut note_stmt = conn.prepare(
                "SELECT title, content_markdown FROM notes WHERE id = ?1 AND is_archived = 0",
            )?;
            if let Ok(note_info) = note_stmt.query_row(params![&item_id], |row| {
                let title: String = row.get(0)?;
                let content: String = row.get(1)?;
                Ok((title, content))
            }) {
                let (title, content) = note_info;
                let preview = clean_text_preview(&content, 180);

                due_items.push(SrsItem {
                    id,
                    item_type: "note".to_string(),
                    item_id,
                    title,
                    subtitle: Some(format!("Knowledge Hub Note • Review Stage {}", review_stage)),
                    content_preview: Some(preview),
                    difficulty: Some("Knowledge".to_string()),
                    tags: vec!["note".to_string()],
                    next_review_date,
                    review_stage,
                    ease_factor,
                    review_count,
                    last_reviewed_at,
                    is_overdue: true,
                });
            }
        }
    }

    Ok(SrsOverview {
        total_items,
        due_today_count,
        mastered_count,
        learning_count,
        due_items,
    })
}

#[tauri::command]
pub fn submit_srs_review(
    input: SubmitSrsReviewInput,
    state: State<'_, AppState>,
) -> AppResult<SrsItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // Fetch existing or initialize
    let existing: Option<(i64, f64, i64)> = {
        let mut stmt = conn.prepare(
            "SELECT review_stage, ease_factor, review_count FROM srs_items WHERE item_type = ?1 AND item_id = ?2",
        )?;
        stmt.query_row(params![&input.item_type, &input.item_id], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        }).ok()
    };

    let (curr_stage, curr_ease, curr_count) = existing.unwrap_or((1, 2.5, 0));

    // Calculate new stage, ease factor, and day interval
    let (new_stage, new_ease, interval_days) = match input.rating.to_lowercase().as_str() {
        "again" => {
            // Failed recall: reset to interval 1
            (1, (curr_ease - 0.2).max(1.3), 1)
        }
        "hard" => {
            // Difficult recall
            let days = match curr_stage {
                1 => 1,
                2 => 2,
                3 => 5,
                _ => (curr_stage * 2).max(1),
            };
            (curr_stage.max(1), (curr_ease - 0.15).max(1.3), days)
        }
        "good" => {
            // Successful recall: advance stage
            let stage = curr_stage + 1;
            let days = match stage {
                1 => 1,
                2 => 3,
                3 => 7,
                4 => 14,
                5 => 30,
                _ => 60,
            };
            (stage, curr_ease, days)
        }
        "easy" => {
            // Effortless recall: jump stage with ease bonus
            let stage = curr_stage + 2;
            let days = match stage {
                1 => 3,
                2 => 7,
                3 => 14,
                4 => 30,
                _ => 90,
            };
            (stage, (curr_ease + 0.15).min(3.5), days)
        }
        _ => (curr_stage + 1, curr_ease, 3),
    };

    let srs_id = format!("srs-{}-{}", input.item_type, input.item_id);

    conn.execute(
        "INSERT INTO srs_items (id, item_type, item_id, next_review_date, review_stage, ease_factor, review_count, last_reviewed_at, created_at, updated_at)
         VALUES (?1, ?2, ?3, date('now', '+' || ?4 || ' days'), ?5, ?6, ?7 + 1, datetime('now'), datetime('now'), datetime('now'))
         ON CONFLICT(item_type, item_id) DO UPDATE SET
            next_review_date = date('now', '+' || ?4 || ' days'),
            review_stage = ?5,
            ease_factor = ?6,
            review_count = review_count + 1,
            last_reviewed_at = datetime('now'),
            updated_at = datetime('now')",
        params![
            &srs_id,
            &input.item_type,
            &input.item_id,
            interval_days,
            new_stage,
            new_ease,
            curr_count,
        ],
    )?;

    // Fetch updated next_review_date
    let next_date: String = conn.query_row(
        "SELECT next_review_date FROM srs_items WHERE item_type = ?1 AND item_id = ?2",
        params![&input.item_type, &input.item_id],
        |row| row.get(0),
    )?;

    Ok(SrsItem {
        id: srs_id,
        item_type: input.item_type,
        item_id: input.item_id,
        title: "Reviewed".to_string(),
        subtitle: None,
        content_preview: None,
        difficulty: None,
        tags: vec![],
        next_review_date: next_date,
        review_stage: new_stage,
        ease_factor: new_ease,
        review_count: curr_count + 1,
        last_reviewed_at: Some(chrono::Utc::now().to_rfc3339()),
        is_overdue: false,
    })
}

#[tauri::command]
pub fn enroll_srs_item(
    item_type: String,
    item_id: String,
    state: State<'_, AppState>,
) -> AppResult<bool> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let srs_id = format!("srs-{}-{}", item_type, item_id);

    conn.execute(
        "INSERT OR IGNORE INTO srs_items (id, item_type, item_id, next_review_date, review_stage, ease_factor, review_count, created_at, updated_at)
         VALUES (?1, ?2, ?3, date('now'), 1, 2.5, 0, datetime('now'), datetime('now'))",
        params![&srs_id, &item_type, &item_id],
    )?;

    Ok(true)
}
