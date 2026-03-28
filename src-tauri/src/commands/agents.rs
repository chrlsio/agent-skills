use std::collections::HashMap;

use crate::models::agent::AgentConfig;
use crate::paths;
use crate::registry::loader::{detect_agents as detect_agents_impl, load_agent_configs};

#[tauri::command]
pub async fn list_agents() -> Result<Vec<AgentConfig>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        load_agent_configs(&paths::agents_dir()).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

#[tauri::command]
pub async fn detect_agents() -> Result<Vec<AgentConfig>, String> {
    tauri::async_runtime::spawn_blocking(|| {
        let configs = load_agent_configs(&paths::agents_dir()).map_err(|e| e.to_string())?;
        Ok(detect_agents_impl(&configs))
    })
    .await
    .map_err(|e| format!("task failed: {e}"))?
}

/// Diagnostic: return resolved paths for debugging Windows build issues.
#[tauri::command]
pub fn debug_paths() -> HashMap<String, String> {
    let mut map = HashMap::new();
    let agents_dir = paths::agents_dir();
    map.insert("agents_dir".into(), agents_dir.to_string_lossy().to_string());
    map.insert("agents_dir_exists".into(), agents_dir.exists().to_string());

    // Count TOML files in agents_dir
    let toml_count = std::fs::read_dir(&agents_dir)
        .map(|rd| rd.flatten().filter(|e| {
            e.path().extension().and_then(|s| s.to_str()) == Some("toml")
        }).count())
        .unwrap_or(0);
    map.insert("agents_toml_count".into(), toml_count.to_string());

    // Home dir
    map.insert("home_dir".into(),
        dirs::home_dir().map(|p| p.to_string_lossy().to_string()).unwrap_or("NONE".into()));

    // Check key skill paths and list contents
    for path in &["~/.claude/skills", "~/.agents/skills"] {
        let expanded = crate::registry::loader::expand_home(path);
        let p = std::path::Path::new(&expanded);
        let exists = p.exists();
        map.insert(format!("{path}_expanded"), expanded.clone());
        map.insert(format!("{path}_exists"), exists.to_string());

        if exists {
            let entries: Vec<String> = std::fs::read_dir(p)
                .into_iter()
                .flatten()
                .flatten()
                .filter_map(|e| {
                    let name = e.file_name().to_string_lossy().to_string();
                    let is_dir = e.path().is_dir();
                    let has_skill = e.path().join("SKILL.md").is_file();
                    if is_dir {
                        Some(format!("{name}{}", if has_skill { " [SKILL.md]" } else { "" }))
                    } else {
                        None
                    }
                })
                .collect();
            map.insert(format!("{path}_contents"), if entries.is_empty() {
                "(empty)".into()
            } else {
                entries.join(", ")
            });
        }
    }

    // Scan result count
    let scan_result = crate::registry::loader::load_agent_configs(&crate::paths::agents_dir())
        .ok()
        .and_then(|configs| {
            let agents = crate::registry::loader::detect_agents(&configs);
            crate::scanner::engine::scan_all_skills(&agents).ok()
        });
    map.insert("scan_total_skills".into(),
        scan_result.as_ref().map(|s| s.len().to_string()).unwrap_or("ERROR".into()));

    map
}
