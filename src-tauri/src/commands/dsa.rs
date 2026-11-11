use tauri::State;
use uuid::Uuid;
use crate::error::{AppError, AppResult};
use crate::models::dsa::{AddDsaProblemInput, DsaProblemItem, DsaTopicItem, UpdateDsaStatusInput};
use crate::state::AppState;

#[tauri::command]
pub fn get_dsa_topics(state: State<'_, AppState>) -> AppResult<Vec<DsaTopicItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare("SELECT id, name, slug FROM dsa_topics ORDER BY sort_order ASC, name ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(DsaTopicItem {
            id: row.get(0)?,
            name: row.get(1)?,
            slug: row.get(2)?,
        })
    })?;

    let mut topics = Vec::new();
    for r in rows {
        topics.push(r?);
    }
    Ok(topics)
}

#[tauri::command]
pub fn get_dsa_problems(state: State<'_, AppState>) -> AppResult<Vec<DsaProblemItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare(
        "SELECT p.id, p.topic_id, t.name, p.title, p.difficulty, p.platform, 
                p.url, p.independent_solve, p.confidence_score, p.revision_due
         FROM dsa_problems p
         JOIN dsa_topics t ON p.topic_id = t.id
         ORDER BY p.created_at DESC"
    )?;

    let rows = stmt.query_map([], |row| {
        let indep_int: i32 = row.get(7)?;
        Ok(DsaProblemItem {
            id: row.get(0)?,
            topic_id: row.get(1)?,
            topic_name: row.get(2)?,
            title: row.get(3)?,
            difficulty: row.get(4)?,
            platform: row.get(5)?,
            url: row.get(6)?,
            independent_solve: indep_int == 1,
            confidence_score: row.get(8)?,
            revision_due: row.get(9)?,
        })
    })?;

    let mut problems = Vec::new();
    for r in rows {
        problems.push(r?);
    }
    Ok(problems)
}

#[tauri::command]
pub fn add_dsa_problem(input: AddDsaProblemInput, state: State<'_, AppState>) -> AppResult<DsaProblemItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let topic_trimmed = input.topic_name.trim();
    let topic_slug = topic_trimmed.to_lowercase().replace(' ', "-");

    // Ensure topic exists
    let topic_id: String = match conn.query_row(
        "SELECT id FROM dsa_topics WHERE slug = ?1",
        [&topic_slug],
        |row| row.get(0),
    ) {
        Ok(id) => id,
        Err(_) => {
            let new_topic_id = Uuid::new_v4().to_string();
            conn.execute(
                "INSERT INTO dsa_topics (id, name, slug) VALUES (?1, ?2, ?3)",
                rusqlite::params![&new_topic_id, topic_trimmed, &topic_slug],
            )?;
            new_topic_id
        }
    };

    let problem_id = Uuid::new_v4().to_string();
    let platform = input.platform.unwrap_or_else(|| "LeetCode".to_string());

    conn.execute(
        "INSERT INTO dsa_problems (id, topic_id, title, difficulty, platform, url, independent_solve, confidence_score)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 1)",
        rusqlite::params![
            &problem_id,
            &topic_id,
            &input.title.trim(),
            &input.difficulty,
            &platform,
            &input.url
        ],
    )?;

    Ok(DsaProblemItem {
        id: problem_id,
        topic_id,
        topic_name: topic_trimmed.to_string(),
        title: input.title.trim().to_string(),
        difficulty: input.difficulty,
        platform,
        url: input.url,
        independent_solve: false,
        confidence_score: 1,
        revision_due: None,
    })
}

#[tauri::command]
pub fn update_dsa_status(input: UpdateDsaStatusInput, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let indep_int = if input.independent_solve { 1 } else { 0 };

    conn.execute(
        "UPDATE dsa_problems 
         SET independent_solve = ?1, confidence_score = ?2, updated_at = datetime('now')
         WHERE id = ?3",
        rusqlite::params![indep_int, input.confidence_score, &input.id],
    )?;

    if input.independent_solve {
        let attempt_id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO dsa_attempts (id, problem_id, success) VALUES (?1, ?2, 1)",
            rusqlite::params![&attempt_id, &input.id],
        )?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_dsa_problem(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM dsa_problems WHERE id = ?1", [&id])?;
    Ok(())
}
