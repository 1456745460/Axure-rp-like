mod projects;

use projects::Db;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let db = projects::init_db(app.handle())?;
            app.manage(Db(std::sync::Mutex::new(db)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            projects::list_projects,
            projects::get_project,
            projects::save_project,
            projects::delete_project,
            projects::export_html,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
