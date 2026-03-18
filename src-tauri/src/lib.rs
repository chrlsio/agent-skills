pub mod commands;
pub mod installer;
pub mod marketplace;
pub mod models;
pub mod parser;
pub mod paths;
pub mod registry;
pub mod scanner;
pub mod watcher;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            paths::init(app.handle());
            watcher::start_skill_watcher(app.handle().clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::agents::list_agents,
            commands::agents::detect_agents,
            commands::skills::scan_all_skills,
            commands::skills::scan_agent_skills,
            commands::skills::install_skill,
            commands::skills::uninstall_skill,
            commands::skills::sync_skill,
            commands::skills::read_skill_content,
            commands::skills::write_skill_content,
            commands::skills::install_from_git,
            commands::skills::fetch_remote_skill_content,
            commands::marketplace::fetch_skillssh,
            commands::marketplace::fetch_clawhub,
            commands::marketplace::search_marketplace,
            commands::marketplace::install_from_marketplace,
            commands::settings::read_settings,
            commands::settings::write_settings,
            commands::settings::clear_marketplace_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
