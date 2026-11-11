use rusqlite::params;
use tauri::State;
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::models::resource::{
    CreateResourceInput, ResourceContentResponse, ResourceItem, SelectedFileInfo,
    UpdateResourceInput,
};
use crate::state::AppState;

#[tauri::command]
pub fn get_resources(
    learning_status: Option<String>,
    resource_type: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<Vec<ResourceItem>> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    let mut query = String::from(
        "SELECT id, title, resource_type, url, author, learning_status, rating, notes, created_at, updated_at
         FROM resources
         WHERE 1=1"
    );

    let mut param_values: Vec<String> = Vec::new();

    if let Some(ref status) = learning_status {
        if status != "all" {
            param_values.push(status.clone());
            query.push_str(&format!(" AND learning_status = ?{}", param_values.len()));
        }
    }

    if let Some(ref rtype) = resource_type {
        if rtype != "all" {
            param_values.push(rtype.clone());
            query.push_str(&format!(" AND resource_type = ?{}", param_values.len()));
        }
    }

    query.push_str(" ORDER BY CASE WHEN learning_status = 'in_progress' THEN 0 WHEN learning_status = 'to_read' THEN 1 ELSE 2 END, rating DESC, updated_at DESC");

    let mut stmt = conn.prepare(&query)?;
    let mut rows = match param_values.len() {
        0 => stmt.query([])?,
        1 => stmt.query(params![param_values[0]])?,
        2 => stmt.query(params![param_values[0], param_values[1]])?,
        _ => stmt.query([])?,
    };

    let mut list = Vec::new();
    while let Some(row) = rows.next()? {
        list.push(ResourceItem {
            id: row.get(0)?,
            title: row.get(1)?,
            resource_type: row.get(2)?,
            url: row.get(3)?,
            author: row.get(4)?,
            learning_status: row.get(5)?,
            rating: row.get(6)?,
            notes: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        });
    }

    Ok(list)
}

#[tauri::command]
pub fn create_resource(
    input: CreateResourceInput,
    state: State<'_, AppState>,
) -> AppResult<ResourceItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let resource_id = format!("res-{}", Uuid::new_v4());
    let status = input.learning_status.unwrap_or_else(|| "to_read".to_string());
    let rating = input.rating.unwrap_or(0);

    conn.execute(
        "INSERT INTO resources (id, title, resource_type, url, author, learning_status, rating, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![
            resource_id,
            input.title,
            input.resource_type,
            input.url,
            input.author,
            status,
            rating,
            input.notes,
        ],
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, title, resource_type, url, author, learning_status, rating, notes, created_at, updated_at
         FROM resources WHERE id = ?1",
    )?;

    let item = stmt.query_row(params![resource_id], |row| {
        Ok(ResourceItem {
            id: row.get(0)?,
            title: row.get(1)?,
            resource_type: row.get(2)?,
            url: row.get(3)?,
            author: row.get(4)?,
            learning_status: row.get(5)?,
            rating: row.get(6)?,
            notes: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?;

    Ok(item)
}

#[tauri::command]
pub fn update_resource(
    id: String,
    input: UpdateResourceInput,
    state: State<'_, AppState>,
) -> AppResult<ResourceItem> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;

    if let Some(ref title) = input.title {
        conn.execute("UPDATE resources SET title = ?1 WHERE id = ?2", params![title, id])?;
    }
    if let Some(ref rtype) = input.resource_type {
        conn.execute("UPDATE resources SET resource_type = ?1 WHERE id = ?2", params![rtype, id])?;
    }
    if let Some(ref url) = input.url {
        conn.execute("UPDATE resources SET url = ?1 WHERE id = ?2", params![url, id])?;
    }
    if let Some(ref author) = input.author {
        conn.execute("UPDATE resources SET author = ?1 WHERE id = ?2", params![author, id])?;
    }
    if let Some(ref status) = input.learning_status {
        conn.execute("UPDATE resources SET learning_status = ?1 WHERE id = ?2", params![status, id])?;
    }
    if let Some(rating) = input.rating {
        conn.execute("UPDATE resources SET rating = ?1 WHERE id = ?2", params![rating, id])?;
    }
    if let Some(ref notes) = input.notes {
        conn.execute("UPDATE resources SET notes = ?1 WHERE id = ?2", params![notes, id])?;
    }

    conn.execute(
        "UPDATE resources SET updated_at = datetime('now') WHERE id = ?1",
        params![id],
    )?;

    let mut stmt = conn.prepare(
        "SELECT id, title, resource_type, url, author, learning_status, rating, notes, created_at, updated_at
         FROM resources WHERE id = ?1",
    )?;

    let item = stmt.query_row(params![id], |row| {
        Ok(ResourceItem {
            id: row.get(0)?,
            title: row.get(1)?,
            resource_type: row.get(2)?,
            url: row.get(3)?,
            author: row.get(4)?,
            learning_status: row.get(5)?,
            rating: row.get(6)?,
            notes: row.get(7)?,
            created_at: row.get(8)?,
            updated_at: row.get(9)?,
        })
    })?;

    Ok(item)
}

#[tauri::command]
pub fn update_resource_status(
    id: String,
    status: String,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute(
        "UPDATE resources SET learning_status = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![status, id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn update_resource_rating(
    id: String,
    rating: i64,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute(
        "UPDATE resources SET rating = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![rating, id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn delete_resource(id: String, state: State<'_, AppState>) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    conn.execute("DELETE FROM resources WHERE id = ?1", params![id])?;
    Ok(())
}

#[tauri::command]
pub fn pick_local_files() -> AppResult<Vec<SelectedFileInfo>> {
    let files = rfd::FileDialog::new()
        .set_title("Select Local Resources (Multi-Select)")
        .add_filter(
            "All Learning Materials",
            &[
                "pdf", "epub", "djvu", "mobi", "docx", "doc", "txt", "md",
                "rs", "py", "ts", "tsx", "js", "cpp", "c", "go", "java", "sql",
                "html", "css", "json", "mp4", "mkv", "webm", "zip",
            ],
        )
        .add_filter("PDF & E-Books (*.pdf, *.epub, *.djvu)", &["pdf", "epub", "djvu", "mobi"])
        .add_filter("Documents & Notes (*.md, *.txt, *.docx)", &["md", "txt", "docx", "doc"])
        .add_filter("Code & Research (*.rs, *.py, *.ts, *.cpp, *.go)", &["rs", "py", "ts", "tsx", "js", "cpp", "c", "go", "java", "sql"])
        .add_filter("Videos & Talks (*.mp4, *.mkv)", &["mp4", "mkv", "webm"])
        .add_filter("All Files (*.*)", &["*"])
        .pick_files();

    match files {
        Some(paths) => {
            let mut list = Vec::new();
            for path in paths {
                let path_str = path.to_string_lossy().to_string();
                let file_name = path
                    .file_name()
                    .map(|f| f.to_string_lossy().to_string())
                    .unwrap_or_else(|| "Unknown File".to_string());
                let extension = path
                    .extension()
                    .map(|e| e.to_string_lossy().to_string().to_lowercase())
                    .unwrap_or_default();
                let file_size_bytes = std::fs::metadata(&path)
                    .map(|m| m.len())
                    .unwrap_or(0);

                list.push(SelectedFileInfo {
                    path: path_str,
                    file_name,
                    extension,
                    file_size_bytes,
                });
            }
            Ok(list)
        }
        None => Ok(Vec::new()),
    }
}

#[tauri::command]
pub fn create_resources_batch(
    inputs: Vec<CreateResourceInput>,
    state: State<'_, AppState>,
) -> AppResult<Vec<ResourceItem>> {
    let mut conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let tx = conn.transaction()?;
    let mut created_items = Vec::new();

    for input in inputs {
        let resource_id = format!("res-{}", Uuid::new_v4());
        let status = input.learning_status.unwrap_or_else(|| "to_read".to_string());
        let rating = input.rating.unwrap_or(0);

        tx.execute(
            "INSERT INTO resources (id, title, resource_type, url, author, learning_status, rating, notes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![
                resource_id,
                input.title,
                input.resource_type,
                input.url,
                input.author,
                status,
                rating,
                input.notes,
            ],
        )?;

        let mut stmt = tx.prepare(
            "SELECT id, title, resource_type, url, author, learning_status, rating, notes, created_at, updated_at
             FROM resources WHERE id = ?1",
        )?;

        let item = stmt.query_row(params![resource_id], |row| {
            Ok(ResourceItem {
                id: row.get(0)?,
                title: row.get(1)?,
                resource_type: row.get(2)?,
                url: row.get(3)?,
                author: row.get(4)?,
                learning_status: row.get(5)?,
                rating: row.get(6)?,
                notes: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;
        created_items.push(item);
    }

    tx.commit()?;
    Ok(created_items)
}

#[tauri::command]
pub fn open_resource_item(target: String) -> AppResult<()> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        let mut cmd = std::process::Command::new("cmd");
        cmd.args(["/c", "start", "", &target])
           .creation_flags(CREATE_NO_WINDOW);
        
        let _ = cmd.spawn().map_err(|e| AppError::Internal(format!("Failed to open resource: {}", e)))?;
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = std::process::Command::new("open")
            .arg(&target)
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to open resource: {}", e)))?;
        Ok(())
    }
}

#[tauri::command]
pub fn reveal_in_explorer(path: String) -> AppResult<()> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        let mut cmd = std::process::Command::new("explorer");
        cmd.arg(format!("/select,{}", path))
           .creation_flags(CREATE_NO_WINDOW);
        
        let _ = cmd.spawn().map_err(|e| AppError::Internal(format!("Failed to reveal file: {}", e)))?;
        return Ok(());
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| AppError::Internal(format!("Failed to reveal file: {}", e)))?;
        Ok(())
    }
}

#[tauri::command]
pub fn load_resource_file_content(path: String) -> AppResult<ResourceContentResponse> {
    use base64::prelude::*;
    use std::path::Path;

    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Err(AppError::NotFound(format!("File does not exist: {}", path)));
    }

    let file_name = file_path
        .file_name()
        .map(|f| f.to_string_lossy().to_string())
        .unwrap_or_else(|| "Resource".to_string());

    let extension = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let metadata = std::fs::metadata(file_path)
        .map_err(|e| AppError::Internal(format!("Failed to read file metadata: {}", e)))?;
    let file_size_bytes = metadata.len();

    let is_pdf = extension == "pdf";
    let is_text = matches!(
        extension.as_str(),
        "md" | "markdown" | "txt" | "rs" | "py" | "ts" | "tsx" | "js" | "jsx" | "html" | "css"
            | "json" | "toml" | "yaml" | "yml" | "sql" | "c" | "cpp" | "h" | "hpp" | "go"
            | "java" | "sh" | "bat" | "ps1" | "log" | "ini" | "xml" | "csv"
    );
    let is_image = matches!(
        extension.as_str(),
        "png" | "jpg" | "jpeg" | "webp" | "gif" | "svg" | "bmp" | "ico"
    );

    let mut text_content = None;
    let mut data_url = None;

    if is_pdf {
        if file_size_bytes > 150 * 1024 * 1024 {
            return Err(AppError::Validation(
                "PDF file exceeds 150MB limit for embedded preview. Please open in external viewer."
                    .to_string(),
            ));
        }
        let bytes = std::fs::read(file_path)
            .map_err(|e| AppError::Internal(format!("Failed to read PDF file: {}", e)))?;
        let encoded = BASE64_STANDARD.encode(&bytes);
        data_url = Some(format!("data:application/pdf;base64,{}", encoded));
    } else if is_text {
        if file_size_bytes > 10 * 1024 * 1024 {
            return Err(AppError::Validation(
                "Text file exceeds 10MB limit for embedded editor.".to_string(),
            ));
        }
        let content = std::fs::read_to_string(file_path).map_err(|e| {
            AppError::Internal(format!("Failed to read text file (ensure UTF-8): {}", e))
        })?;
        text_content = Some(content);
    } else if is_image {
        if file_size_bytes > 30 * 1024 * 1024 {
            return Err(AppError::Validation(
                "Image file exceeds 30MB limit for preview.".to_string(),
            ));
        }
        let bytes = std::fs::read(file_path)
            .map_err(|e| AppError::Internal(format!("Failed to read image file: {}", e)))?;
        let mime = match extension.as_str() {
            "png" => "image/png",
            "jpg" | "jpeg" => "image/jpeg",
            "webp" => "image/webp",
            "gif" => "image/gif",
            "svg" => "image/svg+xml",
            _ => "image/png",
        };
        let encoded = BASE64_STANDARD.encode(&bytes);
        data_url = Some(format!("data:{};base64,{}", mime, encoded));
    }

    Ok(ResourceContentResponse {
        file_name,
        extension,
        file_size_bytes,
        is_pdf,
        is_text,
        is_image,
        text_content,
        data_url,
    })
}

#[tauri::command]
pub fn save_resource_file_content(path: String, content: String) -> AppResult<()> {
    use std::path::Path;
    let file_path = Path::new(&path);
    if !file_path.exists() {
        return Err(AppError::NotFound(format!("File does not exist: {}", path)));
    }
    std::fs::write(file_path, content.as_bytes())
        .map_err(|e| AppError::Internal(format!("Failed to write to file: {}", e)))?;
    Ok(())
}
