use std::path::PathBuf;
use std::sync::OnceLock;

use tauri::Manager;

static RESOURCE_DIR: OnceLock<PathBuf> = OnceLock::new();

pub fn init(app: &tauri::AppHandle) {
    let dir = app
        .path()
        .resource_dir()
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")));
    RESOURCE_DIR.set(dir).ok();
}

pub fn agents_dir() -> PathBuf {
    RESOURCE_DIR
        .get()
        .map(|d| d.join("agents"))
        .unwrap_or_else(|| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("agents"))
}

pub fn templates_dir() -> PathBuf {
    RESOURCE_DIR
        .get()
        .map(|d| d.join("templates"))
        .unwrap_or_else(|| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("templates"))
}
