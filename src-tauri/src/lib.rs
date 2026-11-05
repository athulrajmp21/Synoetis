pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod state;

use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let conn = db::init_db(app.handle())?;
            app.manage(state::AppState::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::get_system_info,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,
            commands::dashboard::get_dashboard_stats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Life OS application");
}
