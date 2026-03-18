use std::path::PathBuf;
use std::thread;

use notify::{RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter};

use crate::paths;
use crate::registry::loader::{detect_agents, load_agent_configs};

pub fn start_skill_watcher(app: AppHandle) {
    let agents_dir = paths::agents_dir();
    let Ok(configs) = load_agent_configs(&agents_dir) else {
        return;
    };
    let detected = detect_agents(&configs);
    let watch_paths: Vec<PathBuf> = detected
        .into_iter()
        .flat_map(|a| a.global_paths.into_iter())
        .map(PathBuf::from)
        .filter(|p| p.exists())
        .collect();

    if watch_paths.is_empty() {
        return;
    }

    thread::spawn(move || {
        let app_handle = app.clone();
        let mut watcher = match notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
            if res.is_ok() {
                let _ = app_handle.emit("skills-changed", "changed");
            }
        }) {
            Ok(w) => w,
            Err(_) => return,
        };

        for path in watch_paths {
            let _ = watcher.watch(&path, RecursiveMode::Recursive);
        }

        loop {
            thread::park();
        }
    });
}
