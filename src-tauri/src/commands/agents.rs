use crate::models::agent::AgentConfig;
use crate::paths;
use crate::registry::loader::{detect_agents as detect_agents_impl, load_agent_configs};

#[tauri::command]
pub fn list_agents() -> Result<Vec<AgentConfig>, String> {
    load_agent_configs(&paths::agents_dir()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn detect_agents() -> Result<Vec<AgentConfig>, String> {
    let configs = load_agent_configs(&paths::agents_dir()).map_err(|e| e.to_string())?;
    Ok(detect_agents_impl(&configs))
}
