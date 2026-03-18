use std::fs;
use std::path::{Path, PathBuf};

use git2::Repository;
use handlebars::Handlebars;
use serde_json::json;
use thiserror::Error;

use crate::models::agent::{AgentConfig, SkillFormat};

#[derive(Debug, Error)]
pub enum InstallError {
    #[error("source skill directory not found: {0}")]
    SourceNotFound(String),
    #[error("agent `{0}` has no global paths configured")]
    MissingTargetPath(String),
    #[error("agent `{0}` is unsupported")]
    AgentNotFound(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("template rendering error: {0}")]
    Template(#[from] handlebars::RenderError),
    #[error("template compile error: {0}")]
    TemplateCompile(#[from] handlebars::TemplateError),
    #[error("git error: {0}")]
    Git(#[from] git2::Error),
}

pub fn install_skill_from_path(
    source_skill_dir: &Path,
    target_agent_slug: &str,
    agents: &[AgentConfig],
) -> Result<PathBuf, InstallError> {
    install_skill_from_path_with_name(source_skill_dir, target_agent_slug, agents, None)
}

fn install_skill_from_path_with_name(
    source_skill_dir: &Path,
    target_agent_slug: &str,
    agents: &[AgentConfig],
    target_skill_name: Option<&str>,
) -> Result<PathBuf, InstallError> {
    if !source_skill_dir.is_dir() {
        return Err(InstallError::SourceNotFound(
            source_skill_dir.to_string_lossy().to_string(),
        ));
    }
    let agent = agents
        .iter()
        .find(|a| a.slug == target_agent_slug)
        .ok_or_else(|| InstallError::AgentNotFound(target_agent_slug.to_string()))?;
    let target_root = agent
        .global_paths
        .first()
        .map(PathBuf::from)
        .ok_or_else(|| InstallError::MissingTargetPath(target_agent_slug.to_string()))?;
    fs::create_dir_all(&target_root)?;

    let fallback = source_skill_dir
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or("skill");
    let skill_name = target_skill_name
        .map(sanitize_skill_dir_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| sanitize_skill_dir_name(fallback));
    let target_skill_dir = target_root.join(&skill_name);
    if target_skill_dir.exists() {
        fs::remove_dir_all(&target_skill_dir)?;
    }
    copy_dir_recursive(source_skill_dir, &target_skill_dir)?;

    if agent.skill_format == SkillFormat::GeminiExtension {
        apply_gemini_install_hook(&target_skill_dir)?;
    }
    if let Some(extra_cfgs) = &agent.extra_config {
        for cfg in extra_cfgs {
            if let (Some(template), Some(target_file)) = (&cfg.template, &cfg.target_file) {
                render_extra_config(template, target_file, target_agent_slug, &skill_name)?;
            }
        }
    }

    Ok(target_skill_dir)
}

pub fn install_skill_from_git(
    repo_url: &str,
    skill_relative_path: &str,
    target_agent_slug: &str,
    agents: &[AgentConfig],
) -> Result<PathBuf, InstallError> {
    let temp_dir = std::env::temp_dir().join(format!(
        "skills-app-install-{}-{}",
        target_agent_slug,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock drift")
            .as_millis()
    ));
    Repository::clone(repo_url, &temp_dir)?;
    let source = temp_dir.join(skill_relative_path);
    let skill_name = derive_git_target_skill_name(repo_url, skill_relative_path, &source);
    let installed =
        install_skill_from_path_with_name(&source, target_agent_slug, agents, Some(&skill_name))?;
    let _ = fs::remove_dir_all(temp_dir);
    Ok(installed)
}

fn derive_git_target_skill_name(repo_url: &str, skill_relative_path: &str, source: &Path) -> String {
    let rel = skill_relative_path.trim();
    if !rel.is_empty() && rel != "." {
        let from_rel = Path::new(rel)
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or(rel);
        return sanitize_skill_dir_name(from_rel);
    }
    let from_repo = repo_url
        .trim_end_matches('/')
        .rsplit('/')
        .next()
        .unwrap_or("skill")
        .trim_end_matches(".git");
    let from_repo = sanitize_skill_dir_name(from_repo);
    if !from_repo.is_empty() {
        return from_repo;
    }
    source
        .file_name()
        .and_then(|s| s.to_str())
        .map(sanitize_skill_dir_name)
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "skill".to_string())
}

fn sanitize_skill_dir_name(raw: &str) -> String {
    raw.trim()
        .chars()
        .map(|ch| match ch {
            '/' | '\\' | ':' => '-',
            _ => ch,
        })
        .collect::<String>()
}

fn apply_gemini_install_hook(target_skill_dir: &Path) -> Result<(), InstallError> {
    let skill_md = target_skill_dir.join("SKILL.md");
    if skill_md.is_file() {
        let content = fs::read_to_string(&skill_md)?;
        let body = strip_frontmatter(&content);
        fs::write(target_skill_dir.join("GEMINI.md"), body)?;
    }
    let ext_path = target_skill_dir.join("gemini-extension.json");
    if !ext_path.exists() {
        let skill_name = target_skill_dir
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or("skill");
        let skeleton = json!({
            "name": skill_name,
            "description": "Generated by Skills Manager",
            "entry": "GEMINI.md"
        });
        fs::write(ext_path, serde_json::to_string_pretty(&skeleton).unwrap_or_default())?;
    }
    Ok(())
}

fn render_extra_config(
    template_file: &str,
    target_file: &str,
    agent_slug: &str,
    skill_name: &str,
) -> Result<(), InstallError> {
    let template_path = crate::paths::templates_dir().join(template_file);
    let template_content = fs::read_to_string(template_path)?;
    let mut hbs = Handlebars::new();
    hbs.register_template_string("extra", template_content)?;
    let rendered = hbs.render(
        "extra",
        &json!({
            "agent_slug": agent_slug,
            "skill_name": skill_name,
        }),
    )?;
    let target_path = expand_home_path(target_file);
    if let Some(parent) = target_path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(target_path, rendered)?;
    Ok(())
}

fn strip_frontmatter(content: &str) -> String {
    let lines: Vec<&str> = content.lines().collect();
    if lines.first().copied() != Some("---") {
        return content.to_string();
    }
    let closing = lines
        .iter()
        .enumerate()
        .skip(1)
        .find_map(|(idx, line)| if *line == "---" { Some(idx) } else { None });
    let Some(idx) = closing else {
        return content.to_string();
    };
    if idx + 1 >= lines.len() {
        return String::new();
    }
    lines[idx + 1..].join("\n")
}

fn copy_dir_recursive(source: &Path, target: &Path) -> Result<(), std::io::Error> {
    fs::create_dir_all(target)?;
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = target.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(src_path, dst_path)?;
        }
    }
    Ok(())
}

fn expand_home_path(path: &str) -> PathBuf {
    if let Some(stripped) = path.strip_prefix("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(stripped);
        }
    }
    PathBuf::from(path)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::agent::AgentConfig;

    fn test_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "skills-app-installer-{name}-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .expect("clock drift")
                .as_millis()
        ));
        fs::create_dir_all(&dir).expect("create temp dir");
        dir
    }

    #[test]
    fn install_from_path_copies_skill_files() {
        let src = test_dir("src");
        let src_skill = src.join("demo");
        fs::create_dir_all(src_skill.join("scripts")).expect("create scripts");
        fs::write(src_skill.join("SKILL.md"), "# demo").expect("write skill");
        fs::write(src_skill.join("scripts/run.sh"), "echo hi").expect("write script");

        let out = test_dir("out");
        let agent = AgentConfig {
            slug: "codex".into(),
            name: "Codex".into(),
            global_paths: vec![out.to_string_lossy().to_string()],
            ..Default::default()
        };
        let target = install_skill_from_path(&src_skill, "codex", &[agent]).expect("install");
        assert!(target.join("SKILL.md").is_file());
        assert!(target.join("scripts/run.sh").is_file());
    }

    #[test]
    fn gemini_hook_generates_gemini_files() {
        let src = test_dir("gem-src");
        let src_skill = src.join("gem-demo");
        fs::create_dir_all(&src_skill).expect("create skill dir");
        fs::write(
            src_skill.join("SKILL.md"),
            "---\nname: x\n---\n# Gemini Body\nhello",
        )
        .expect("write skill");

        let out = test_dir("gem-out");
        let agent = AgentConfig {
            slug: "gemini-cli".into(),
            name: "Gemini".into(),
            global_paths: vec![out.to_string_lossy().to_string()],
            skill_format: SkillFormat::GeminiExtension,
            ..Default::default()
        };
        let target = install_skill_from_path(&src_skill, "gemini-cli", &[agent]).expect("install");
        assert!(target.join("GEMINI.md").is_file());
        assert!(target.join("gemini-extension.json").is_file());
    }

    #[test]
    fn git_install_name_uses_repo_basename_for_root() {
        let source = std::path::Path::new("/tmp/skills-app-install-12345");
        let name =
            derive_git_target_skill_name("https://github.com/org/awesome-skill.git", ".", source);
        assert_eq!(name, "awesome-skill");
    }

    #[test]
    fn git_install_name_uses_relative_path_basename() {
        let source = std::path::Path::new("/tmp/skills-app-install-12345/skills/my-tool");
        let name = derive_git_target_skill_name(
            "https://github.com/org/mono-repo.git",
            "skills/my-tool",
            source,
        );
        assert_eq!(name, "my-tool");
    }
}
