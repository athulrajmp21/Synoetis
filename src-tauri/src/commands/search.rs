use rusqlite::params;
use std::time::Instant;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::models::search::{OmniSearchResponse, OmniSearchResultItem};
use crate::state::AppState;

fn is_local_path(url: &str) -> bool {
    let u = url.trim();
    if u.is_empty() {
        return false;
    }
    // Check Windows drive (e.g. C:\) or UNC path or Unix root
    if u.len() >= 2 && u.chars().nth(1) == Some(':') {
        return true;
    }
    u.starts_with('\\') || u.starts_with('/')
}

fn clean_preview(text: &str, max_len: usize) -> String {
    // Strip raw JSON block syntax if notes are JSON-encoded
    let cleaned = if text.trim_start().starts_with('[') && text.contains("\"content\"") {
        // Simple extraction of content values from JSON blocks
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
        if extracted.is_empty() {
            text.to_string()
        } else {
            extracted
        }
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
pub fn global_omnisearch(
    query: String,
    filter_category: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<OmniSearchResponse> {
    let start_time = Instant::now();
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let q = query.trim();
    let filter = filter_category.unwrap_or_else(|| "all".to_string()).to_lowercase();
    let mut items = Vec::new();

    if q.is_empty() {
        // Default State: Fetch recent / in-progress highlights across modules
        // 1. In-progress / reading resources
        if filter == "all" || filter == "resource" || filter == "book" {
            let mut stmt = conn.prepare(
                "SELECT id, title, resource_type, url, author, learning_status, rating
                 FROM resources
                 ORDER BY CASE WHEN learning_status = 'in_progress' THEN 0 ELSE 1 END, updated_at DESC
                 LIMIT 4",
            )?;
            let rows = stmt.query_map([], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let rtype: String = row.get(2)?;
                let url: Option<String> = row.get(3)?;
                let author: Option<String> = row.get(4)?;
                let status: String = row.get(5)?;
                let _rating: i64 = row.get(6)?;

                let is_local = url.as_deref().map(is_local_path).unwrap_or(false);
                let badge = if is_local {
                    format!("{} • LOCAL FILE", rtype.to_uppercase())
                } else {
                    format!("{} • {}", rtype.to_uppercase(), status.replace('_', " ").to_uppercase())
                };

                Ok(OmniSearchResultItem {
                    id: id.clone(),
                    category: "resource".to_string(),
                    title,
                    subtitle: author.map(|a| format!("by {}", a)).or_else(|| url.clone()),
                    badge: Some(badge),
                    badge_color: Some(if status == "in_progress" { "amber".to_string() } else { "stone".to_string() }),
                    url_or_path: url,
                    target_route: format!("/study?resourceId={}", id),
                    is_local_file: is_local,
                    match_preview: Some("Continue reading in Split-View Studio".to_string()),
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // 2. Pending Tasks
        if filter == "all" || filter == "task" {
            let mut stmt = conn.prepare(
                "SELECT id, title, description, priority, status, due_date
                 FROM tasks
                 WHERE status != 'done' AND status != 'canceled'
                 ORDER BY CASE WHEN priority = 'urgent' THEN 0 WHEN priority = 'high' THEN 1 ELSE 2 END, due_date ASC
                 LIMIT 4",
            )?;
            let rows = stmt.query_map([], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let desc: Option<String> = row.get(2)?;
                let priority: String = row.get(3)?;
                let status: String = row.get(4)?;
                let due: Option<String> = row.get(5)?;

                let badge_color = match priority.as_str() {
                    "urgent" => "rose",
                    "high" => "amber",
                    _ => "stone",
                };

                let sub = if let Some(d) = due {
                    format!("Due: {} • {}", d, desc.unwrap_or_default())
                } else {
                    desc.unwrap_or_default()
                };

                Ok(OmniSearchResultItem {
                    id,
                    category: "task".to_string(),
                    title,
                    subtitle: if sub.is_empty() { None } else { Some(sub) },
                    badge: Some(format!("{} • {}", priority.to_uppercase(), status.to_uppercase())),
                    badge_color: Some(badge_color.to_string()),
                    url_or_path: None,
                    target_route: "/tasks".to_string(),
                    is_local_file: false,
                    match_preview: None,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // 3. Knowledge Notes (Pinned or Recent)
        if filter == "all" || filter == "note" {
            let mut stmt = conn.prepare(
                "SELECT id, title, content_markdown, is_pinned, updated_at
                 FROM notes
                 WHERE is_archived = 0
                 ORDER BY is_pinned DESC, updated_at DESC
                 LIMIT 4",
            )?;
            let rows = stmt.query_map([], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let content: String = row.get(2)?;
                let is_pinned: i32 = row.get(3)?;
                let _updated: String = row.get(4)?;

                let preview = clean_preview(&content, 110);

                Ok(OmniSearchResultItem {
                    id: id.clone(),
                    category: "note".to_string(),
                    title,
                    subtitle: if preview.is_empty() { None } else { Some(preview.clone()) },
                    badge: Some(if is_pinned == 1 { "PINNED NOTE".to_string() } else { "KNOWLEDGE DOC".to_string() }),
                    badge_color: Some("purple".to_string()),
                    url_or_path: None,
                    target_route: format!("/study?noteId={}", id),
                    is_local_file: false,
                    match_preview: Some(preview),
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // 4. Developer Snippets (Favorites & High Usage)
        if filter == "all" || filter == "snippet" {
            let mut stmt = conn.prepare(
                "SELECT id, title, description, code, language, category, tags, is_favorite
                 FROM snippets
                 ORDER BY is_favorite DESC, usage_count DESC, updated_at DESC
                 LIMIT 4",
            )?;
            let rows = stmt.query_map([], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let desc: Option<String> = row.get(2)?;
                let code: String = row.get(3)?;
                let lang: String = row.get(4)?;
                let cat: String = row.get(5)?;
                let _tags: Option<String> = row.get(6)?;
                let is_fav: i64 = row.get(7)?;

                let badge = format!("{} • {}", lang.to_uppercase(), cat.to_uppercase());
                Ok(OmniSearchResultItem {
                    id: id.clone(),
                    category: "snippet".to_string(),
                    title,
                    subtitle: desc.or_else(|| Some(code.clone())),
                    badge: Some(if is_fav == 1 { format!("★ {}", badge) } else { badge }),
                    badge_color: Some("amber".to_string()),
                    url_or_path: Some(code),
                    target_route: format!("/snippets?id={}", id),
                    is_local_file: false,
                    match_preview: None,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }
    } else {
        // User typed a search term: Query across tables using SQLite LIKE
        let pattern = format!("%{}%", q);

        // =========================================================================
        // A. Resources & Local Books/Papers
        // =========================================================================
        if filter == "all" || filter == "resource" || filter == "book" {
            let mut stmt = conn.prepare(
                "SELECT id, title, resource_type, url, author, learning_status, rating, notes
                 FROM resources
                 WHERE title LIKE ?1 OR author LIKE ?1 OR url LIKE ?1 OR notes LIKE ?1
                 ORDER BY CASE WHEN title LIKE ?1 THEN 0 ELSE 1 END,
                          CASE WHEN learning_status = 'in_progress' THEN 0 ELSE 1 END,
                          rating DESC
                 LIMIT 8",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let rtype: String = row.get(2)?;
                let url: Option<String> = row.get(3)?;
                let author: Option<String> = row.get(4)?;
                let _status: String = row.get(5)?;
                let rating: i64 = row.get(6)?;
                let notes: Option<String> = row.get(7)?;

                let is_local = url.as_deref().map(is_local_path).unwrap_or(false);
                let badge = if is_local {
                    format!("{} • LOCAL FILE", rtype.to_uppercase())
                } else {
                    format!("{} • ★{}", rtype.to_uppercase(), rating)
                };

                let preview = notes.map(|n| clean_preview(&n, 120));

                Ok(OmniSearchResultItem {
                    id: id.clone(),
                    category: "resource".to_string(),
                    title,
                    subtitle: author.map(|a| format!("by {}", a)).or_else(|| url.clone()),
                    badge: Some(badge),
                    badge_color: Some(if is_local { "blue".to_string() } else { "amber".to_string() }),
                    url_or_path: url,
                    target_route: format!("/study?resourceId={}", id),
                    is_local_file: is_local,
                    match_preview: preview,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // B. Knowledge Hub Notes
        // =========================================================================
        if filter == "all" || filter == "note" {
            let mut stmt = conn.prepare(
                "SELECT id, title, content_markdown, is_pinned, updated_at
                 FROM notes
                 WHERE is_archived = 0 AND (title LIKE ?1 OR content_markdown LIKE ?1)
                 ORDER BY CASE WHEN title LIKE ?1 THEN 0 ELSE 1 END, is_pinned DESC, updated_at DESC
                 LIMIT 8",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let content: String = row.get(2)?;
                let is_pinned: i32 = row.get(3)?;
                let _updated: String = row.get(4)?;

                let preview = clean_preview(&content, 130);

                Ok(OmniSearchResultItem {
                    id: id.clone(),
                    category: "note".to_string(),
                    title,
                    subtitle: if preview.is_empty() { None } else { Some(preview.clone()) },
                    badge: Some(if is_pinned == 1 { "PINNED NOTE".to_string() } else { "NOTE".to_string() }),
                    badge_color: Some("purple".to_string()),
                    url_or_path: None,
                    target_route: format!("/study?noteId={}", id),
                    is_local_file: false,
                    match_preview: Some(preview),
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // C. Tasks
        // =========================================================================
        if filter == "all" || filter == "task" {
            let mut stmt = conn.prepare(
                "SELECT id, title, description, priority, status, category, due_date
                 FROM tasks
                 WHERE title LIKE ?1 OR description LIKE ?1 OR category LIKE ?1
                 ORDER BY CASE WHEN title LIKE ?1 THEN 0 ELSE 1 END,
                          CASE WHEN status = 'todo' THEN 0 WHEN status = 'in_progress' THEN 1 ELSE 2 END,
                          CASE WHEN priority = 'urgent' THEN 0 WHEN priority = 'high' THEN 1 ELSE 2 END
                 LIMIT 8",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let desc: Option<String> = row.get(2)?;
                let priority: String = row.get(3)?;
                let status: String = row.get(4)?;
                let category: String = row.get(5)?;
                let due: Option<String> = row.get(6)?;

                let badge_color = match priority.as_str() {
                    "urgent" => "rose",
                    "high" => "amber",
                    _ => "stone",
                };

                let mut sub_parts = Vec::new();
                if let Some(d) = due {
                    sub_parts.push(format!("Due: {}", d));
                }
                sub_parts.push(format!("Category: {}", category));
                if let Some(d) = desc {
                    if !d.is_empty() {
                        sub_parts.push(clean_preview(&d, 60));
                    }
                }

                Ok(OmniSearchResultItem {
                    id,
                    category: "task".to_string(),
                    title,
                    subtitle: Some(sub_parts.join(" • ")),
                    badge: Some(format!("{} • {}", priority.to_uppercase(), status.to_uppercase())),
                    badge_color: Some(badge_color.to_string()),
                    url_or_path: None,
                    target_route: "/tasks".to_string(),
                    is_local_file: false,
                    match_preview: None,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // D. DSA Problems & Algorithms
        // =========================================================================
        if filter == "all" || filter == "dsa" {
            let mut stmt = conn.prepare(
                "SELECT p.id, p.title, p.difficulty, p.platform, p.url, t.name as topic_name
                 FROM dsa_problems p
                 LEFT JOIN dsa_topics t ON p.topic_id = t.id
                 WHERE p.title LIKE ?1 OR t.name LIKE ?1 OR p.difficulty LIKE ?1 OR p.platform LIKE ?1
                 ORDER BY CASE WHEN p.title LIKE ?1 THEN 0 ELSE 1 END, p.title ASC
                 LIMIT 8",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let difficulty: String = row.get(2)?;
                let platform: String = row.get(3)?;
                let url: Option<String> = row.get(4)?;
                let topic_name: Option<String> = row.get(5)?;

                let badge_color = match difficulty.as_str() {
                    "Hard" => "rose",
                    "Medium" => "amber",
                    _ => "emerald",
                };

                Ok(OmniSearchResultItem {
                    id,
                    category: "dsa".to_string(),
                    title,
                    subtitle: topic_name.map(|t| format!("Topic: {} • {}", t, platform)).or(Some(platform)),
                    badge: Some(format!("{} DSA", difficulty.to_uppercase())),
                    badge_color: Some(badge_color.to_string()),
                    url_or_path: url,
                    target_route: "/dsa".to_string(),
                    is_local_file: false,
                    match_preview: None,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // E. Career Applications & Companies
        // =========================================================================
        if filter == "all" || filter == "career" || filter == "job" {
            let mut stmt = conn.prepare(
                "SELECT a.id, c.name as company_name, a.role, a.status, a.salary_range, a.job_url, c.tier
                 FROM applications a
                 JOIN companies c ON a.company_id = c.id
                 WHERE c.name LIKE ?1 OR a.role LIKE ?1 OR a.notes LIKE ?1
                 ORDER BY CASE WHEN c.name LIKE ?1 THEN 0 ELSE 1 END, a.updated_at DESC
                 LIMIT 6",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let company_name: String = row.get(1)?;
                let role: String = row.get(2)?;
                let status: String = row.get(3)?;
                let salary: Option<String> = row.get(4)?;
                let job_url: Option<String> = row.get(5)?;
                let tier: Option<String> = row.get(6)?;

                let badge_color = match status.as_str() {
                    "offer" => "emerald",
                    "interview" => "amber",
                    "rejected" => "rose",
                    _ => "blue",
                };

                let mut sub = format!("{} • {}", role, tier.unwrap_or_else(|| "Tier 1".to_string()));
                if let Some(s) = salary {
                    sub.push_str(&format!(" ({})", s));
                }

                Ok(OmniSearchResultItem {
                    id,
                    category: "career".to_string(),
                    title: company_name,
                    subtitle: Some(sub),
                    badge: Some(status.replace('_', " ").to_uppercase()),
                    badge_color: Some(badge_color.to_string()),
                    url_or_path: job_url,
                    target_route: "/career".to_string(),
                    is_local_file: false,
                    match_preview: None,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // F. Goals & Milestones
        // =========================================================================
        if filter == "all" || filter == "goal" {
            let mut stmt = conn.prepare(
                "SELECT id, title, category, timeframe, status, progress, description
                 FROM goals
                 WHERE title LIKE ?1 OR description LIKE ?1 OR category LIKE ?1
                 ORDER BY CASE WHEN title LIKE ?1 THEN 0 ELSE 1 END, progress DESC
                 LIMIT 6",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let category: String = row.get(2)?;
                let timeframe: String = row.get(3)?;
                let status: String = row.get(4)?;
                let progress: f64 = row.get(5)?;
                let desc: Option<String> = row.get(6)?;

                let badge_color = if progress >= 100.0 {
                    "emerald"
                } else if status == "in_progress" {
                    "amber"
                } else {
                    "stone"
                };

                let sub = format!(
                    "{} • {} (Progress: {:.0}%)",
                    category.to_uppercase(),
                    timeframe.replace('_', " ").to_uppercase(),
                    progress
                );

                Ok(OmniSearchResultItem {
                    id,
                    category: "goal".to_string(),
                    title,
                    subtitle: Some(sub),
                    badge: Some(format!("{:.0}% DONE", progress)),
                    badge_color: Some(badge_color.to_string()),
                    url_or_path: None,
                    target_route: "/goals".to_string(),
                    is_local_file: false,
                    match_preview: desc.map(|d| clean_preview(&d, 100)),
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // G. Projects
        // =========================================================================
        if filter == "all" || filter == "project" {
            let mut stmt = conn.prepare(
                "SELECT id, title, description, tech_stack, status, priority, repo_url
                 FROM projects
                 WHERE title LIKE ?1 OR description LIKE ?1 OR tech_stack LIKE ?1
                 ORDER BY CASE WHEN title LIKE ?1 THEN 0 ELSE 1 END, updated_at DESC
                 LIMIT 6",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let desc: Option<String> = row.get(2)?;
                let tech_stack: Option<String> = row.get(3)?;
                let status: String = row.get(4)?;
                let priority: String = row.get(5)?;
                let repo_url: Option<String> = row.get(6)?;

                Ok(OmniSearchResultItem {
                    id,
                    category: "project".to_string(),
                    title,
                    subtitle: tech_stack.or(desc),
                    badge: Some(format!("{} • {}", status.to_uppercase(), priority.to_uppercase())),
                    badge_color: Some("blue".to_string()),
                    url_or_path: repo_url,
                    target_route: "/projects".to_string(),
                    is_local_file: false,
                    match_preview: None,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // H. Courses (Academic OS)
        // =========================================================================
        if filter == "all" || filter == "academic" || filter == "course" {
            let mut stmt = conn.prepare(
                "SELECT id, code, title, instructor, status
                 FROM courses
                 WHERE code LIKE ?1 OR title LIKE ?1 OR instructor LIKE ?1
                 ORDER BY CASE WHEN code LIKE ?1 THEN 0 ELSE 1 END, updated_at DESC
                 LIMIT 4",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let code: String = row.get(1)?;
                let title: String = row.get(2)?;
                let instructor: Option<String> = row.get(3)?;
                let status: String = row.get(4)?;

                Ok(OmniSearchResultItem {
                    id,
                    category: "course".to_string(),
                    title: format!("{}: {}", code, title),
                    subtitle: instructor.map(|i| format!("Instructor: {}", i)),
                    badge: Some(status.to_uppercase()),
                    badge_color: Some("emerald".to_string()),
                    url_or_path: None,
                    target_route: "/academic".to_string(),
                    is_local_file: false,
                    match_preview: None,
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }

        // =========================================================================
        // I. Developer Snippets & CLI Cheat Sheets
        // =========================================================================
        if filter == "all" || filter == "snippet" {
            let mut stmt = conn.prepare(
                "SELECT id, title, description, code, language, category, tags, is_favorite
                 FROM snippets
                 WHERE title LIKE ?1 OR description LIKE ?1 OR code LIKE ?1 OR tags LIKE ?1 OR category LIKE ?1
                 ORDER BY CASE WHEN title LIKE ?1 THEN 0 ELSE 1 END,
                          is_favorite DESC,
                          usage_count DESC
                 LIMIT 8",
            )?;
            let rows = stmt.query_map(params![pattern], |row| {
                let id: String = row.get(0)?;
                let title: String = row.get(1)?;
                let desc: Option<String> = row.get(2)?;
                let code: String = row.get(3)?;
                let lang: String = row.get(4)?;
                let cat: String = row.get(5)?;
                let _tags: Option<String> = row.get(6)?;
                let is_fav: i64 = row.get(7)?;

                let badge = format!("{} • {}", lang.to_uppercase(), cat.to_uppercase());
                Ok(OmniSearchResultItem {
                    id: id.clone(),
                    category: "snippet".to_string(),
                    title,
                    subtitle: desc,
                    badge: Some(if is_fav == 1 { format!("★ {}", badge) } else { badge }),
                    badge_color: Some("amber".to_string()),
                    url_or_path: Some(code.clone()),
                    target_route: format!("/snippets?id={}", id),
                    is_local_file: false,
                    match_preview: Some(code),
                })
            })?;
            for r in rows {
                items.push(r?);
            }
        }
    }

    let execution_time_ms = start_time.elapsed().as_millis();
    let total_count = items.len();

    Ok(OmniSearchResponse {
        query: query.to_string(),
        total_count,
        execution_time_ms,
        items,
    })
}
