use tauri::{AppHandle, State};
use crate::error::{AppError, AppResult};
use crate::models::system::SystemInfo;
use crate::state::AppState;
use crate::db::get_db_path;

#[tauri::command]
pub fn get_system_info(app_handle: AppHandle, state: State<'_, AppState>) -> AppResult<SystemInfo> {
    let db_path = get_db_path(&app_handle)?
        .to_string_lossy()
        .to_string();

    let conn = state.db.lock().map_err(|e| AppError::Internal(e.to_string()))?;
    
    let total_tables: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
        [],
        |row| row.get(0),
    )?;

    Ok(SystemInfo {
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        db_path,
        os: std::env::consts::OS.to_string(),
        total_tables,
    })
}

#[tauri::command]
pub fn get_autostart_enabled() -> AppResult<bool> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        if let Ok(key) = hkcu.open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run") {
            if key.get_value::<String, _>("Synoetis").is_ok() {
                return Ok(true);
            }
            if key.get_value::<String, _>("LifeOS").is_ok() {
                return Ok(true);
            }
        }
        Ok(false)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[tauri::command]
pub fn set_autostart_enabled(enabled: bool) -> AppResult<()> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::*;
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (key, _) = hkcu.create_subkey(r"Software\Microsoft\Windows\CurrentVersion\Run")
            .map_err(|e| AppError::Internal(format!("Failed to open registry Run key: {}", e)))?;

        if enabled {
            let current_exe = std::env::current_exe()
                .map_err(|e| AppError::Internal(format!("Failed to get executable path: {}", e)))?;
            let exe_path = current_exe.to_string_lossy().to_string();
            let cmd_val = format!("\"{}\" --minimized", exe_path);

            key.set_value("Synoetis", &cmd_val)
                .map_err(|e| AppError::Internal(format!("Failed to set registry value: {}", e)))?;

            // Clean up legacy key if present
            let _ = key.delete_value("LifeOS");
        } else {
            let _ = key.delete_value("Synoetis");
            let _ = key.delete_value("LifeOS");
        }

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Ok(())
    }
}

#[tauri::command]
pub fn set_tray_visible(app_handle: AppHandle, visible: bool) -> AppResult<()> {
    if visible {
        let _ = crate::create_tray(&app_handle);
    } else {
        crate::remove_tray(&app_handle);
    }
    Ok(())
}

#[tauri::command]
pub fn exit_app(app_handle: AppHandle) -> AppResult<()> {
    crate::remove_tray(&app_handle);
    app_handle.exit(0);
    Ok(())
}
