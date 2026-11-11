pub mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod state;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

pub fn create_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    if app.tray_by_id("synoetis-tray").is_some() {
        return Ok(());
    }

    let show_item = MenuItem::with_id(app, "show", "Open Synoetis", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let focus_item = MenuItem::with_id(app, "quick_focus", "Start 25m Focus", true, None::<&str>)?;
    let deepwork_item = MenuItem::with_id(app, "quick_deepwork", "Start 50m Deep Work", true, None::<&str>)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit Synoetis", true, None::<&str>)?;

    let tray_menu = Menu::with_items(
        app,
        &[&show_item, &sep1, &focus_item, &deepwork_item, &sep2, &quit_item],
    )?;

    let mut tray_builder = TrayIconBuilder::with_id("synoetis-tray")
        .menu(&tray_menu)
        .tooltip("Synoetis - Second Brain & Engineering Operating System")
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(win) = app.get_webview_window("main") {
                        let _ = win.show();
                        let _ = win.unminimize();
                        let _ = win.set_focus();
                    }
                }
                "quick_focus" => {
                    if let Some(win) = app.get_webview_window("main") {
                        let _ = win.show();
                        let _ = win.unminimize();
                        let _ = win.set_focus();
                        let _ = win.emit("start-quick-timer", "pomodoro");
                    }
                }
                "quick_deepwork" => {
                    if let Some(win) = app.get_webview_window("main") {
                        let _ = win.show();
                        let _ = win.unminimize();
                        let _ = win.set_focus();
                        let _ = win.emit("start-quick-timer", "deepwork");
                    }
                }
                "quit" => {
                    let _ = app.remove_tray_by_id("synoetis-tray");
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(win) = app.get_webview_window("main") {
                    let is_visible = win.is_visible().unwrap_or(false);
                    let is_minimized = win.is_minimized().unwrap_or(false);
                    if is_visible && !is_minimized {
                        let _ = win.hide();
                    } else {
                        let _ = win.show();
                        let _ = win.unminimize();
                        let _ = win.set_focus();
                    }
                }
            }
        });

    if let Some(icon) = app.default_window_icon() {
        tray_builder = tray_builder.icon(icon.clone());
    }

    let _ = tray_builder.build(app)?;
    Ok(())
}

pub fn remove_tray(app: &AppHandle) {
    let _ = app.remove_tray_by_id("synoetis-tray");
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.unminimize();
                let _ = win.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let conn = db::init_db(app.handle())?;
            app.manage(state::AppState::new(conn));
            
            // Build Tray Icon if enabled
            let initial_tray_enabled = {
                if let Ok(conn) = app.state::<state::AppState>().db.lock() {
                    let val: Result<String, _> = conn.query_row(
                        "SELECT value FROM settings WHERE key = 'minimize_to_tray_on_close'",
                        [],
                        |row| row.get(0),
                    );
                    val.map(|v| v != "false").unwrap_or(true)
                } else {
                    true
                }
            };
            if initial_tray_enabled {
                let _ = create_tray(app.handle());
            }

            // Window Close-to-Tray handler
            if let Some(main_win) = app.get_webview_window("main") {
                let win_clone = main_win.clone();
                let app_handle = app.handle().clone();
                main_win.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        let close_to_tray = {
                            if let Some(state) = app_handle.try_state::<state::AppState>() {
                                if let Ok(conn) = state.db.lock() {
                                    let val: Result<String, _> = conn.query_row(
                                        "SELECT value FROM settings WHERE key = 'minimize_to_tray_on_close'",
                                        [],
                                        |row| row.get(0),
                                    );
                                    val.map(|v| v != "false").unwrap_or(true)
                                } else {
                                    true
                                }
                            } else {
                                true
                            }
                        };

                        if close_to_tray {
                            api.prevent_close();
                            let _ = create_tray(&app_handle);
                            let _ = win_clone.hide();
                        } else {
                            remove_tray(&app_handle);
                            app_handle.exit(0);
                        }
                    }
                });
            }
            
            let start_minimized = std::env::args().any(|arg| arg == "--minimized");
            if !start_minimized {
                for (_key, win) in app.webview_windows() {
                    let _ = win.show();
                    let _ = win.set_focus();
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // System & Settings
            commands::system::get_system_info,
            commands::system::get_autostart_enabled,
            commands::system::set_autostart_enabled,
            commands::system::set_tray_visible,
            commands::system::exit_app,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,
            commands::dashboard::get_dashboard_stats,
            
            // Tasks
            commands::tasks::get_tasks,
            commands::tasks::create_task,
            commands::tasks::update_task_status,
            commands::tasks::delete_task,

            // Habits
            commands::habits::get_habits,
            commands::habits::create_habit,
            commands::habits::toggle_habit_today,
            commands::habits::delete_habit,

            // Knowledge Hub (Notes)
            commands::notes::get_notes,
            commands::notes::get_note_by_id,
            commands::notes::save_note,
            commands::notes::delete_note,
            commands::notes::export_notes_to_folder,
            commands::notes::import_markdown_notes,

            // DSA Tracker
            commands::dsa::get_dsa_topics,
            commands::dsa::get_dsa_problems,
            commands::dsa::add_dsa_problem,
            commands::dsa::update_dsa_status,
            commands::dsa::delete_dsa_problem,

            // Academic OS
            commands::academic::get_semesters,
            commands::academic::get_courses,
            commands::academic::create_course,
            commands::academic::delete_course,
            commands::academic::get_assessments,
            commands::academic::create_assessment,
            commands::academic::toggle_assessment_status,
            commands::academic::set_active_semester,
            commands::academic::get_class_schedules,
            commands::academic::create_class_schedule,
            commands::academic::delete_class_schedule,
            commands::academic::simulate_gpa,

            // Spaced Repetition (SRS)
            commands::srs::get_srs_overview,
            commands::srs::submit_srs_review,
            commands::srs::enroll_srs_item,

            // Projects
            commands::projects::get_projects,
            commands::projects::create_project,
            commands::projects::update_project_status,
            commands::projects::delete_project,

            // Focus & Study Sessions
            commands::focus::log_study_session,
            commands::focus::start_background_focus_timer,
            commands::focus::pause_background_focus_timer,
            commands::focus::reset_background_focus_timer,
            commands::focus::get_background_focus_timer,
            commands::focus::send_desktop_notification,

            // Career OS
            commands::career::get_companies,
            commands::career::get_applications,
            commands::career::create_application,
            commands::career::update_application_status,
            commands::career::delete_application,
            commands::career::get_interviews,
            commands::career::create_interview,
            commands::career::delete_interview,

            // Goals & Milestones
            commands::goals::get_goals,
            commands::goals::create_goal,
            commands::goals::update_goal,
            commands::goals::update_goal_progress,
            commands::goals::update_goal_status,
            commands::goals::delete_goal,
            commands::goals::get_milestones,
            commands::goals::create_milestone,
            commands::goals::toggle_milestone,
            commands::goals::delete_milestone,

            // Resources & Library
            commands::resources::get_resources,
            commands::resources::create_resource,
            commands::resources::update_resource,
            commands::resources::update_resource_status,
            commands::resources::update_resource_rating,
            commands::resources::delete_resource,
            commands::resources::pick_local_files,
            commands::resources::create_resources_batch,
            commands::resources::open_resource_item,
            commands::resources::reveal_in_explorer,
            commands::resources::load_resource_file_content,
            commands::resources::save_resource_file_content,

            // Backup & Data Portability
            commands::backup::get_backup_info,
            commands::backup::export_database_backup,
            commands::backup::export_json_archive,
            commands::backup::pick_backup_file,
            commands::backup::validate_backup_file,
            commands::backup::restore_database_from_backup,

            // Velocity & Analytics
            commands::analytics::get_analytics_overview,

            // Developer Snippet Vault & CLI Cheat Sheets
            commands::snippets::get_snippets,
            commands::snippets::create_snippet,
            commands::snippets::update_snippet,
            commands::snippets::toggle_snippet_favorite,
            commands::snippets::increment_snippet_usage,
            commands::snippets::delete_snippet,
            commands::snippets::export_snippets_json,

            // Omnisearch
            commands::search::global_omnisearch,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
