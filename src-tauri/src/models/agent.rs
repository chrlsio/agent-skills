use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
pub enum SkillFormat {
    #[default]
    #[serde(rename = "skill-md")]
    SkillMd,
    #[serde(rename = "gemini-extension")]
    GeminiExtension,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AgentHooks {
    pub install: Option<String>,
    pub uninstall: Option<String>,
    pub sync: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ExtraConfig {
    pub template: Option<String>,
    pub target_file: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AgentConfig {
    pub slug: String,
    pub name: String,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default)]
    pub global_paths: Vec<String>,
    #[serde(default)]
    pub skill_format: SkillFormat,
    #[serde(default)]
    pub extra_config: Option<Vec<ExtraConfig>>,
    #[serde(default)]
    pub hooks: Option<AgentHooks>,
    #[serde(default)]
    pub cli_command: Option<String>,
    #[serde(default)]
    pub install_command: Option<String>,
    #[serde(default)]
    pub install_docs_url: Option<String>,
    #[serde(default)]
    pub install_source_label: Option<String>,
    #[serde(default)]
    pub detected: bool,
}

fn default_enabled() -> bool {
    true
}
