use tauri::State;
use uuid::Uuid;
use crate::error::{AppError, AppResult};
use crate::models::academic::{
    AssessmentItem, ClassScheduleItem, CourseItem, CreateAssessmentInput, CreateClassScheduleInput,
    CreateCourseInput, GpaSimulationInput, GpaSimulationResult, SemesterItem,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_semesters(state: State<'_, AppState>) -> AppResult<Vec<SemesterItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut stmt = conn.prepare("SELECT id, number, name, status, target_gpa, actual_gpa FROM semesters ORDER BY number ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(SemesterItem {
            id: row.get(0)?,
            number: row.get(1)?,
            name: row.get(2)?,
            status: row.get(3)?,
            target_gpa: row.get(4)?,
            actual_gpa: row.get(5)?,
        })
    })?;

    let mut semesters = Vec::new();
    for r in rows {
        semesters.push(r?);
    }

    // If blank/empty, auto-initialize the 8 standard engineering semesters
    if semesters.is_empty() {
        for n in 1..=8 {
            let id = Uuid::new_v4().to_string();
            let name = format!("Semester {}", n);
            let status = if n == 1 { "active" } else { "upcoming" };
            conn.execute(
                "INSERT INTO semesters (id, number, name, status) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![&id, n, &name, status],
            )?;
            semesters.push(SemesterItem {
                id,
                number: n,
                name,
                status: status.to_string(),
                target_gpa: None,
                actual_gpa: None,
            });
        }
    }

    Ok(semesters)
}

#[tauri::command]
pub fn get_courses(semester_id: Option<String>, state: State<'_, AppState>) -> AppResult<Vec<CourseItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    
    let mut courses = Vec::new();
    if let Some(sem_id) = semester_id {
        let mut stmt = conn.prepare(
            "SELECT id, semester_id, code, title, credits, instructor, target_grade, final_grade, status 
             FROM courses WHERE semester_id = ?1 ORDER BY code ASC"
        )?;
        let rows = stmt.query_map([&sem_id], |row| {
            Ok(CourseItem {
                id: row.get(0)?,
                semester_id: row.get(1)?,
                code: row.get(2)?,
                title: row.get(3)?,
                credits: row.get(4)?,
                instructor: row.get(5)?,
                target_grade: row.get(6)?,
                final_grade: row.get(7)?,
                status: row.get(8)?,
            })
        })?;
        for r in rows {
            courses.push(r?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT id, semester_id, code, title, credits, instructor, target_grade, final_grade, status 
             FROM courses ORDER BY code ASC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(CourseItem {
                id: row.get(0)?,
                semester_id: row.get(1)?,
                code: row.get(2)?,
                title: row.get(3)?,
                credits: row.get(4)?,
                instructor: row.get(5)?,
                target_grade: row.get(6)?,
                final_grade: row.get(7)?,
                status: row.get(8)?,
            })
        })?;
        for r in rows {
            courses.push(r?);
        }
    }

    Ok(courses)
}

#[tauri::command]
pub fn create_course(input: CreateCourseInput, state: State<'_, AppState>) -> AppResult<CourseItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO courses (id, semester_id, code, title, credits, instructor, target_grade, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'enrolled')",
        rusqlite::params![
            &id,
            &input.semester_id,
            &input.code.trim().to_uppercase(),
            &input.title.trim(),
            input.credits,
            &input.instructor,
            &input.target_grade
        ],
    )?;

    Ok(CourseItem {
        id,
        semester_id: input.semester_id,
        code: input.code.trim().to_uppercase(),
        title: input.title.trim().to_string(),
        credits: input.credits,
        instructor: input.instructor,
        target_grade: input.target_grade,
        final_grade: None,
        status: "enrolled".to_string(),
    })
}

#[tauri::command]
pub fn delete_course(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM courses WHERE id = ?1", [&id])?;
    Ok(())
}

#[tauri::command]
pub fn get_assessments(course_id: Option<String>, state: State<'_, AppState>) -> AppResult<Vec<AssessmentItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let mut assessments = Vec::new();

    if let Some(c_id) = course_id {
        let mut stmt = conn.prepare(
            "SELECT a.id, a.course_id, c.title, a.title, a.assessment_type, a.due_date, a.status, a.weightage 
             FROM assessments a
             JOIN courses c ON a.course_id = c.id
             WHERE a.course_id = ?1
             ORDER BY a.due_date ASC"
        )?;
        let rows = stmt.query_map([&c_id], |row| {
            Ok(AssessmentItem {
                id: row.get(0)?,
                course_id: row.get(1)?,
                course_title: row.get(2)?,
                title: row.get(3)?,
                assessment_type: row.get(4)?,
                due_date: row.get(5)?,
                status: row.get(6)?,
                weightage: row.get(7)?,
            })
        })?;
        for r in rows {
            assessments.push(r?);
        }
    } else {
        let mut stmt = conn.prepare(
            "SELECT a.id, a.course_id, c.title, a.title, a.assessment_type, a.due_date, a.status, a.weightage 
             FROM assessments a
             JOIN courses c ON a.course_id = c.id
             ORDER BY a.due_date ASC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(AssessmentItem {
                id: row.get(0)?,
                course_id: row.get(1)?,
                course_title: row.get(2)?,
                title: row.get(3)?,
                assessment_type: row.get(4)?,
                due_date: row.get(5)?,
                status: row.get(6)?,
                weightage: row.get(7)?,
            })
        })?;
        for r in rows {
            assessments.push(r?);
        }
    }

    Ok(assessments)
}

#[tauri::command]
pub fn create_assessment(input: CreateAssessmentInput, state: State<'_, AppState>) -> AppResult<AssessmentItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = Uuid::new_v4().to_string();

    let course_title: String = conn.query_row(
        "SELECT title FROM courses WHERE id = ?1",
        [&input.course_id],
        |row| row.get(0),
    ).unwrap_or_else(|_| "Unknown Course".to_string());

    conn.execute(
        "INSERT INTO assessments (id, course_id, title, assessment_type, due_date, status)
         VALUES (?1, ?2, ?3, ?4, ?5, 'pending')",
        rusqlite::params![
            &id,
            &input.course_id,
            &input.title.trim(),
            &input.assessment_type,
            &input.due_date
        ],
    )?;

    Ok(AssessmentItem {
        id,
        course_id: input.course_id,
        course_title,
        title: input.title.trim().to_string(),
        assessment_type: input.assessment_type,
        due_date: input.due_date,
        status: "pending".to_string(),
        weightage: None,
    })
}

#[tauri::command]
pub fn toggle_assessment_status(id: String, state: State<'_, AppState>) -> AppResult<String> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let current_status: String = conn.query_row(
        "SELECT status FROM assessments WHERE id = ?1",
        [&id],
        |row| row.get(0),
    )?;

    let next_status = if current_status == "pending" { "submitted" } else { "pending" };
    conn.execute(
        "UPDATE assessments SET status = ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![next_status, &id],
    )?;

    Ok(next_status.to_string())
}

#[tauri::command]
pub fn set_active_semester(
    semester_number: i32,
    target_gpa: Option<f64>,
    degree: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    // Ensure all 8 semesters exist and update statuses
    for n in 1..=8 {
        let name = format!("Semester {}", n);
        let status = if n < semester_number {
            "completed"
        } else if n == semester_number {
            "active"
        } else {
            "upcoming"
        };
        let id = Uuid::new_v4().to_string();

        let exists: bool = conn
            .query_row(
                "SELECT count(*) > 0 FROM semesters WHERE number = ?1",
                rusqlite::params![n],
                |row| row.get(0),
            )
            .unwrap_or(false);

        if !exists {
            conn.execute(
                "INSERT INTO semesters (id, number, name, status, target_gpa) VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![&id, n, &name, status, target_gpa],
            )?;
        } else if n == semester_number {
            conn.execute(
                "UPDATE semesters SET status = 'active', target_gpa = COALESCE(?1, target_gpa) WHERE number = ?2",
                rusqlite::params![target_gpa, n],
            )?;
        } else if n < semester_number {
            conn.execute(
                "UPDATE semesters SET status = 'completed' WHERE number = ?1",
                rusqlite::params![n],
            )?;
        } else {
            conn.execute(
                "UPDATE semesters SET status = 'upcoming' WHERE number = ?1",
                rusqlite::params![n],
            )?;
        }
    }

    // Save to settings table
    conn.execute(
        "INSERT INTO settings (key, value, updated_at) VALUES ('academic_active_semester', ?1, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
        rusqlite::params![semester_number.to_string()],
    )?;

    if let Some(deg) = degree {
        conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES ('academic_degree', ?1, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
            rusqlite::params![deg],
        )?;
    }

    if let Some(gpa) = target_gpa {
        conn.execute(
            "INSERT INTO settings (key, value, updated_at) VALUES ('academic_target_gpa', ?1, datetime('now'))
             ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')",
            rusqlite::params![gpa.to_string()],
        )?;
    }

    Ok(())
}

fn grade_to_point(grade: &str) -> f64 {
    match grade.trim().to_uppercase().as_str() {
        "A+" | "A" => 4.0,
        "A-" => 3.7,
        "B+" => 3.3,
        "B" => 3.0,
        "B-" => 2.7,
        "C+" => 2.3,
        "C" => 2.0,
        "C-" => 1.7,
        "D+" => 1.3,
        "D" => 1.0,
        _ => 0.0,
    }
}

#[tauri::command]
pub fn get_class_schedules(
    semester_id: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<Vec<ClassScheduleItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let sql = if semester_id.is_some() {
        "SELECT cs.id, cs.course_id, c.code, c.title, cs.day_of_week, cs.start_time, cs.end_time, cs.room, cs.building, cs.class_type
         FROM class_schedule cs
         JOIN courses c ON cs.course_id = c.id
         WHERE c.semester_id = ?1
         ORDER BY cs.day_of_week ASC, cs.start_time ASC"
    } else {
        "SELECT cs.id, cs.course_id, c.code, c.title, cs.day_of_week, cs.start_time, cs.end_time, cs.room, cs.building, cs.class_type
         FROM class_schedule cs
         JOIN courses c ON cs.course_id = c.id
         ORDER BY cs.day_of_week ASC, cs.start_time ASC"
    };

    let mut schedules = Vec::new();

    if let Some(ref sem_id) = semester_id {
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map([sem_id], |row| {
            Ok(ClassScheduleItem {
                id: row.get(0)?,
                course_id: row.get(1)?,
                course_code: row.get(2)?,
                course_title: row.get(3)?,
                day_of_week: row.get(4)?,
                start_time: row.get(5)?,
                end_time: row.get(6)?,
                room: row.get(7)?,
                building: row.get(8)?,
                class_type: row.get(9)?,
            })
        })?;
        for r in rows {
            schedules.push(r?);
        }
    } else {
        let mut stmt = conn.prepare(sql)?;
        let rows = stmt.query_map([], |row| {
            Ok(ClassScheduleItem {
                id: row.get(0)?,
                course_id: row.get(1)?,
                course_code: row.get(2)?,
                course_title: row.get(3)?,
                day_of_week: row.get(4)?,
                start_time: row.get(5)?,
                end_time: row.get(6)?,
                room: row.get(7)?,
                building: row.get(8)?,
                class_type: row.get(9)?,
            })
        })?;
        for r in rows {
            schedules.push(r?);
        }
    }

    Ok(schedules)
}

#[tauri::command]
pub fn create_class_schedule(
    input: CreateClassScheduleInput,
    state: State<'_, AppState>,
) -> AppResult<ClassScheduleItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = format!("sched-{}", Uuid::new_v4());
    let class_type = input.class_type.unwrap_or_else(|| "lecture".to_string());

    conn.execute(
        "INSERT INTO class_schedule (id, course_id, day_of_week, start_time, end_time, room, building, class_type, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))",
        rusqlite::params![
            &id,
            &input.course_id,
            input.day_of_week,
            &input.start_time,
            &input.end_time,
            input.room.as_deref().map(str::trim),
            input.building.as_deref().map(str::trim),
            &class_type,
        ],
    )?;

    // Fetch course code and title
    let (code, title) = conn.query_row(
        "SELECT code, title FROM courses WHERE id = ?1",
        rusqlite::params![&input.course_id],
        |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
    ).unwrap_or(("COURSE".to_string(), "Enrolled Course".to_string()));

    Ok(ClassScheduleItem {
        id,
        course_id: input.course_id,
        course_code: code,
        course_title: title,
        day_of_week: input.day_of_week,
        start_time: input.start_time,
        end_time: input.end_time,
        room: input.room,
        building: input.building,
        class_type,
    })
}

#[tauri::command]
pub fn delete_class_schedule(id: String, state: State<'_, AppState>) -> AppResult<bool> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let affected = conn.execute("DELETE FROM class_schedule WHERE id = ?1", rusqlite::params![&id])?;
    Ok(affected > 0)
}

#[tauri::command]
pub fn simulate_gpa(input: GpaSimulationInput) -> AppResult<GpaSimulationResult> {
    let mut sem_credits = 0.0;
    let mut sem_quality_points = 0.0;

    for course in &input.simulated_courses {
        let pts = grade_to_point(&course.simulated_grade);
        sem_credits += course.credits;
        sem_quality_points += course.credits * pts;
    }

    let sem_gpa = if sem_credits > 0.0 {
        (sem_quality_points / sem_credits * 100.0).round() / 100.0
    } else {
        0.0
    };

    let total_credits = input.current_completed_credits + sem_credits;
    let total_points = (input.current_completed_credits * input.current_cumulative_gpa) + sem_quality_points;

    let proj_gpa = if total_credits > 0.0 {
        (total_points / total_credits * 100.0).round() / 100.0
    } else {
        sem_gpa
    };

    let change = (proj_gpa - input.current_cumulative_gpa * 100.0).round() / 100.0;

    Ok(GpaSimulationResult {
        semester_credits: sem_credits,
        semester_gpa: sem_gpa,
        cumulative_credits: total_credits,
        projected_cumulative_gpa: proj_gpa,
        gpa_change: change,
    })
}
