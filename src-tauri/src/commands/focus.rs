use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use rusqlite::params;
use tauri::{AppHandle, Emitter, State};
use uuid::Uuid;
use chrono::Local;
use tauri_plugin_notification::NotificationExt;

use crate::error::{AppError, AppResult};
use crate::state::AppState;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ActiveTimerState {
    pub mode: String,
    pub total_seconds: u64,
    pub seconds_remaining: i64,
    pub is_running: bool,
    pub target_end_timestamp_ms: i64,
}

static CURRENT_TIMER: std::sync::OnceLock<Arc<Mutex<Option<ActiveTimerState>>>> = std::sync::OnceLock::new();
static CURRENT_CANCEL_FLAG: std::sync::OnceLock<Arc<Mutex<Option<Arc<AtomicBool>>>>> = std::sync::OnceLock::new();

fn get_timer_store() -> &'static Arc<Mutex<Option<ActiveTimerState>>> {
    CURRENT_TIMER.get_or_init(|| Arc::new(Mutex::new(None)))
}

fn get_cancel_flag_holder() -> &'static Arc<Mutex<Option<Arc<AtomicBool>>>> {
    CURRENT_CANCEL_FLAG.get_or_init(|| Arc::new(Mutex::new(None)))
}

#[tauri::command]
pub fn start_background_focus_timer(
    duration_seconds: u64,
    mode: String,
    app: AppHandle,
    state: State<'_, AppState>,
) -> AppResult<ActiveTimerState> {
    // 1. Cancel existing background task if any
    {
        let holder = get_cancel_flag_holder().lock().unwrap();
        if let Some(ref flag) = *holder {
            flag.store(true, Ordering::SeqCst);
        }
    }

    let cancel_flag = Arc::new(AtomicBool::new(false));
    {
        let mut holder = get_cancel_flag_holder().lock().unwrap();
        *holder = Some(cancel_flag.clone());
    }

    let target_ms = Local::now().timestamp_millis() + (duration_seconds as i64 * 1000);

    let timer_state = ActiveTimerState {
        mode: mode.clone(),
        total_seconds: duration_seconds,
        seconds_remaining: duration_seconds as i64,
        is_running: true,
        target_end_timestamp_ms: target_ms,
    };

    {
        let mut store = get_timer_store().lock().unwrap();
        *store = Some(timer_state.clone());
    }

    let cancel_for_task = cancel_flag.clone();
    let mode_for_task = mode.clone();
    let app_handle = app.clone();
    let db_arc = state.db.clone();

    // Spawn background timer thread
    std::thread::spawn(move || {
        let sleep_duration = std::time::Duration::from_secs(duration_seconds);
        // Sleep in small increments so cancellation is responsive
        let start = std::time::Instant::now();
        while start.elapsed() < sleep_duration {
            if cancel_for_task.load(Ordering::SeqCst) {
                return;
            }
            std::thread::sleep(std::time::Duration::from_millis(250));
        }

        if cancel_for_task.load(Ordering::SeqCst) {
            return;
        }

        // Timer completed!
        {
            let mut store = get_timer_store().lock().unwrap();
            if let Some(ref mut t) = *store {
                t.is_running = false;
                t.seconds_remaining = 0;
            }
        }

        // 1. Play native Windows chime
        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            let _ = std::process::Command::new("powershell")
                .args(["-NoProfile", "-Command", "[System.Media.SystemSounds]::Asterisk.Play()"])
                .creation_flags(CREATE_NO_WINDOW)
                .spawn();
        }

        // 2. Fire native Windows Toast Notification
        let title = match mode_for_task.as_str() {
            "deepwork" => "Deep Work Session Complete! 🎯",
            "shortbreak" => "Break Complete! Ready for Next Sprint? ⚡",
            _ => "Pomodoro Complete! 🍅",
        };
        let body = match mode_for_task.as_str() {
            "deepwork" => "50 minutes of focused deep work logged to your dashboard.",
            "shortbreak" => "Take a deep breath and dive back into your flow state.",
            _ => "25 minutes of deep focus achieved! Time for a 5-minute breather.",
        };

        let _ = app_handle
            .notification()
            .builder()
            .title(title)
            .body(body)
            .show();

        // 3. Log to SQLite if not shortbreak
        if mode_for_task != "shortbreak" {
            let minutes = (duration_seconds / 60) as i64;
            let summary = format!(
                "{} session (background focus)",
                if mode_for_task == "deepwork" {
                    "Deep Work"
                } else {
                    "Pomodoro"
                }
            );
            if let Ok(conn) = db_arc.lock() {
                let id = Uuid::new_v4().to_string();
                let _ = conn.execute(
                    "INSERT INTO study_sessions (id, duration_minutes, start_time, end_time, summary, focus_rating)
                     VALUES (?1, ?2, datetime('now', '-' || ?2 || ' minutes'), datetime('now'), ?3, 5)",
                    params![&id, minutes, &summary],
                );
            }
        }

        // 4. Emit event to all windows
        let _ = app_handle.emit("focus-timer-completed", mode_for_task);
    });

    Ok(timer_state)
}

#[tauri::command]
pub fn pause_background_focus_timer() -> AppResult<()> {
    let holder = get_cancel_flag_holder().lock().unwrap();
    if let Some(ref flag) = *holder {
        flag.store(true, Ordering::SeqCst);
    }
    let mut store = get_timer_store().lock().unwrap();
    if let Some(ref mut t) = *store {
        t.is_running = false;
        let now = Local::now().timestamp_millis();
        let rem = (t.target_end_timestamp_ms - now) / 1000;
        t.seconds_remaining = rem.max(0);
    }
    Ok(())
}

#[tauri::command]
pub fn reset_background_focus_timer() -> AppResult<()> {
    let holder = get_cancel_flag_holder().lock().unwrap();
    if let Some(ref flag) = *holder {
        flag.store(true, Ordering::SeqCst);
    }
    let mut store = get_timer_store().lock().unwrap();
    if let Some(ref mut t) = *store {
        t.is_running = false;
        t.seconds_remaining = t.total_seconds as i64;
    }
    Ok(())
}

#[tauri::command]
pub fn get_background_focus_timer() -> AppResult<Option<ActiveTimerState>> {
    let mut store = get_timer_store().lock().unwrap();
    if let Some(ref mut t) = *store {
        if t.is_running {
            let now = Local::now().timestamp_millis();
            let rem = (t.target_end_timestamp_ms - now) / 1000;
            t.seconds_remaining = rem.max(0);
            if rem <= 0 {
                t.is_running = false;
            }
        }
        Ok(Some(t.clone()))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn send_desktop_notification(title: String, body: String, app: AppHandle) -> AppResult<()> {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        let _ = std::process::Command::new("powershell")
            .args(["-NoProfile", "-Command", "[System.Media.SystemSounds]::Asterisk.Play()"])
            .creation_flags(CREATE_NO_WINDOW)
            .spawn();
    }

    let _ = app
        .notification()
        .builder()
        .title(&title)
        .body(&body)
        .show();

    Ok(())
}

#[tauri::command]
pub fn log_study_session(
    duration_minutes: i64,
    summary: Option<String>,
    course_id: Option<String>,
    state: State<'_, AppState>,
) -> AppResult<()> {
    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO study_sessions (id, course_id, duration_minutes, start_time, end_time, summary, focus_rating)
         VALUES (?1, ?2, ?3, datetime('now', '-' || ?3 || ' minutes'), datetime('now'), ?4, 5)",
        params![
            &id,
            course_id,
            duration_minutes,
            summary.as_deref().map(str::trim),
        ],
    )?;

    Ok(())
}
