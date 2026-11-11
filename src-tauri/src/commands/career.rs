use rusqlite::params;
use tauri::State;
use uuid::Uuid;
use crate::error::{AppError, AppResult};
use crate::models::career::{
    ApplicationItem, CompanyItem, CreateApplicationInput, CreateInterviewInput, InterviewItem,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_companies(state: State<'_, AppState>) -> AppResult<Vec<CompanyItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let mut stmt = conn.prepare(
        "SELECT id, name, website, tier, notes FROM companies ORDER BY name ASC",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(CompanyItem {
            id: row.get(0)?,
            name: row.get(1)?,
            website: row.get(2)?,
            tier: row.get(3)?,
            notes: row.get(4)?,
        })
    })?;

    let mut companies = Vec::new();
    for r in rows {
        companies.push(r?);
    }
    Ok(companies)
}

#[tauri::command]
pub fn get_applications(state: State<'_, AppState>) -> AppResult<Vec<ApplicationItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let mut stmt = conn.prepare(
        "SELECT 
            a.id, 
            a.company_id, 
            c.name, 
            c.tier, 
            c.website, 
            a.role, 
            a.job_url, 
            a.salary_range, 
            a.status, 
            a.applied_date, 
            a.deadline, 
            a.notes,
            COALESCE((SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id), 0) AS int_count,
            a.updated_at
         FROM applications a
         JOIN companies c ON a.company_id = c.id
         ORDER BY a.updated_at DESC",
    )?;

    let rows = stmt.query_map([], |row| {
        Ok(ApplicationItem {
            id: row.get(0)?,
            company_id: row.get(1)?,
            company_name: row.get(2)?,
            company_tier: row.get(3)?,
            company_website: row.get(4)?,
            role: row.get(5)?,
            job_url: row.get(6)?,
            salary_range: row.get(7)?,
            status: row.get(8)?,
            applied_date: row.get(9)?,
            deadline: row.get(10)?,
            notes: row.get(11)?,
            interviews_count: row.get(12)?,
            updated_at: row.get(13)?,
        })
    })?;

    let mut apps = Vec::new();
    for r in rows {
        apps.push(r?);
    }
    Ok(apps)
}

#[tauri::command]
pub fn create_application(
    input: CreateApplicationInput,
    state: State<'_, AppState>,
) -> AppResult<ApplicationItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let company_name = input.company_name.trim().to_string();
    if company_name.is_empty() {
        return Err(AppError::Validation("Company name cannot be empty".to_string()));
    }

    // 1. Find or create company
    let mut check_stmt = conn.prepare("SELECT id, tier, website FROM companies WHERE LOWER(name) = LOWER(?1)")?;
    let existing_company = check_stmt
        .query_row(params![&company_name], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, Option<String>>(1)?, row.get::<_, Option<String>>(2)?))
        })
        .ok();

    let (company_id, company_tier, company_website) = match existing_company {
        Some((id, tier, website)) => (id, tier, website),
        None => {
            let new_c_id = Uuid::new_v4().to_string();
            let tier = input.company_tier.clone().unwrap_or_else(|| "Tier 1".to_string());
            conn.execute(
                "INSERT INTO companies (id, name, website, tier, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, datetime('now'), datetime('now'))",
                params![
                    &new_c_id,
                    &company_name,
                    input.company_website.as_deref().map(str::trim),
                    &tier,
                ],
            )?;
            (new_c_id, Some(tier), input.company_website.clone())
        }
    };

    // 2. Insert application
    let app_id = Uuid::new_v4().to_string();
    let status = input.status.unwrap_or_else(|| "applied".to_string());

    conn.execute(
        "INSERT INTO applications (id, company_id, role, job_url, salary_range, status, applied_date, deadline, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now'), datetime('now'))",
        params![
            &app_id,
            &company_id,
            input.role.trim(),
            input.job_url.as_deref().map(str::trim),
            input.salary_range.as_deref().map(str::trim),
            &status,
            input.applied_date.as_deref().map(str::trim),
            input.deadline.as_deref().map(str::trim),
            input.notes.as_deref().map(str::trim),
        ],
    )?;

    Ok(ApplicationItem {
        id: app_id,
        company_id,
        company_name,
        company_tier,
        company_website,
        role: input.role.trim().to_string(),
        job_url: input.job_url.map(|u| u.trim().to_string()),
        salary_range: input.salary_range.map(|s| s.trim().to_string()),
        status,
        applied_date: input.applied_date.map(|d| d.trim().to_string()),
        deadline: input.deadline.map(|d| d.trim().to_string()),
        notes: input.notes.map(|n| n.trim().to_string()),
        interviews_count: 0,
        updated_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn update_application_status(
    id: String,
    status: String,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute(
        "UPDATE applications SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![status, id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_application(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM applications WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn get_interviews(
    application_id: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<Vec<InterviewItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let sql = match &application_id {
        Some(_) => "SELECT i.id, i.application_id, c.name, a.role, i.round_name, i.interview_date, i.interviewer_info, i.questions_asked, i.notes, i.result, i.created_at
                    FROM interviews i
                    JOIN applications a ON i.application_id = a.id
                    JOIN companies c ON a.company_id = c.id
                    WHERE i.application_id = ?1
                    ORDER BY i.created_at DESC",
        None => "SELECT i.id, i.application_id, c.name, a.role, i.round_name, i.interview_date, i.interviewer_info, i.questions_asked, i.notes, i.result, i.created_at
                 FROM interviews i
                 JOIN applications a ON i.application_id = a.id
                 JOIN companies c ON a.company_id = c.id
                 ORDER BY i.created_at DESC",
    };

    let mut stmt = conn.prepare(sql)?;
    let mut list = Vec::new();

    if let Some(app_id) = &application_id {
        let mut rows = stmt.query(params![app_id])?;
        while let Some(row) = rows.next()? {
            list.push(InterviewItem {
                id: row.get(0)?,
                application_id: row.get(1)?,
                company_name: row.get(2)?,
                role: row.get(3)?,
                round_name: row.get(4)?,
                interview_date: row.get(5)?,
                interviewer_info: row.get(6)?,
                questions_asked: row.get(7)?,
                notes: row.get(8)?,
                result: row.get(9)?,
                created_at: row.get(10)?,
            });
        }
    } else {
        let mut rows = stmt.query([])?;
        while let Some(row) = rows.next()? {
            list.push(InterviewItem {
                id: row.get(0)?,
                application_id: row.get(1)?,
                company_name: row.get(2)?,
                role: row.get(3)?,
                round_name: row.get(4)?,
                interview_date: row.get(5)?,
                interviewer_info: row.get(6)?,
                questions_asked: row.get(7)?,
                notes: row.get(8)?,
                result: row.get(9)?,
                created_at: row.get(10)?,
            });
        }
    }

    Ok(list)
}

#[tauri::command]
pub fn create_interview(
    input: CreateInterviewInput,
    state: State<'_, AppState>,
) -> AppResult<InterviewItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = Uuid::new_v4().to_string();
    let result = input.result.unwrap_or_else(|| "pending".to_string());

    conn.execute(
        "INSERT INTO interviews (id, application_id, round_name, interview_date, interviewer_info, questions_asked, notes, result, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))",
        params![
            &id,
            &input.application_id,
            input.round_name.trim(),
            input.interview_date.as_deref().map(str::trim),
            input.interviewer_info.as_deref().map(str::trim),
            input.questions_asked.as_deref().map(str::trim),
            input.notes.as_deref().map(str::trim),
            &result,
        ],
    )?;

    // Also update application updated_at
    let _ = conn.execute(
        "UPDATE applications SET updated_at = datetime('now') WHERE id = ?1",
        params![&input.application_id],
    );

    // Fetch company name & role for the returned item
    let mut stmt = conn.prepare(
        "SELECT c.name, a.role FROM applications a JOIN companies c ON a.company_id = c.id WHERE a.id = ?1",
    )?;
    let (comp_name, role): (Option<String>, Option<String>) = stmt
        .query_row(params![&input.application_id], |row| Ok((row.get(0)?, row.get(1)?)))
        .unwrap_or((None, None));

    Ok(InterviewItem {
        id,
        application_id: input.application_id,
        company_name: comp_name,
        role,
        round_name: input.round_name.trim().to_string(),
        interview_date: input.interview_date.map(|d| d.trim().to_string()),
        interviewer_info: input.interviewer_info.map(|i| i.trim().to_string()),
        questions_asked: input.questions_asked.map(|q| q.trim().to_string()),
        notes: input.notes.map(|n| n.trim().to_string()),
        result,
        created_at: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn delete_interview(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM interviews WHERE id = ?1", params![id])?;
    Ok(())
}
