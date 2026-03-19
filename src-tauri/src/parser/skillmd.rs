use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use thiserror::Error;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SkillDirAssets {
    pub scripts: bool,
    pub references: bool,
    pub assets: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ParsedSkillMd {
    pub name: Option<String>,
    pub description: Option<String>,
    pub metadata: Option<Value>,
    pub body: String,
    pub asset_dirs: SkillDirAssets,
}

#[derive(Debug, Error)]
pub enum SkillMdParseError {
    #[error("failed to read SKILL.md: {0}")]
    Io(#[from] std::io::Error),
    #[error("invalid YAML frontmatter: {0}")]
    InvalidFrontmatter(#[from] serde_yaml::Error),
}

#[derive(Debug, Deserialize, Default)]
struct Frontmatter {
    name: Option<String>,
    description: Option<String>,
    metadata: Option<Value>,
}

pub fn parse_skill_md_file(path: &Path) -> Result<ParsedSkillMd, SkillMdParseError> {
    let content = fs::read_to_string(path)?;
    let base_dir = path.parent().unwrap_or(Path::new("."));
    parse_skill_md_content(&content, base_dir)
}

pub fn parse_skill_md_content(
    content: &str,
    base_dir: &Path,
) -> Result<ParsedSkillMd, SkillMdParseError> {
    let (frontmatter, body) = split_frontmatter(content)?;
    let asset_dirs = detect_asset_dirs(base_dir);
    Ok(ParsedSkillMd {
        name: frontmatter.name,
        description: frontmatter.description,
        metadata: frontmatter.metadata,
        body,
        asset_dirs,
    })
}

fn split_frontmatter(content: &str) -> Result<(Frontmatter, String), SkillMdParseError> {
    let trimmed = content.trim();
    if trimmed.is_empty() {
        return Ok((Frontmatter::default(), String::new()));
    }

    let lines: Vec<&str> = content.lines().collect();
    if lines.first().copied() != Some("---") {
        return Ok((Frontmatter::default(), content.to_string()));
    }

    let closing = lines
        .iter()
        .enumerate()
        .skip(1)
        .find_map(|(idx, line)| if *line == "---" { Some(idx) } else { None });

    let Some(end_idx) = closing else {
        return Ok((Frontmatter::default(), content.to_string()));
    };

    let yaml = lines[1..end_idx].join("\n");
    let body = if end_idx + 1 < lines.len() {
        lines[end_idx + 1..].join("\n")
    } else {
        String::new()
    };

    if yaml.trim().is_empty() {
        return Ok((Frontmatter::default(), body));
    }

    let frontmatter: Frontmatter = serde_yaml::from_str(&yaml)?;
    Ok((frontmatter, body))
}

fn detect_asset_dirs(base_dir: &Path) -> SkillDirAssets {
    let scripts = base_dir.join("scripts").is_dir();
    let references = base_dir.join("references").is_dir();
    let assets = base_dir.join("assets").is_dir();
    SkillDirAssets {
        scripts,
        references,
        assets,
    }
}

pub fn skill_id_from_path(path: &Path) -> String {
    let normalized: PathBuf = path
        .components()
        .collect::<PathBuf>()
        .canonicalize()
        .unwrap_or_else(|_| path.to_path_buf());
    normalized.to_string_lossy().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn test_dir(name: &str) -> PathBuf {
        let millis = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .expect("clock drift")
            .as_millis();
        let dir = std::env::temp_dir().join(format!("skills-app-{name}-{millis}"));
        fs::create_dir_all(&dir).expect("create temp test dir");
        dir
    }

    #[test]
    fn parse_with_frontmatter() {
        let dir = test_dir("frontmatter");
        fs::create_dir_all(dir.join("scripts")).expect("create scripts");
        let content = r#"---
name: test-skill
description: parse yaml frontmatter
metadata:
  level: advanced
---
# Body
Hello
"#;
        let parsed = parse_skill_md_content(content, &dir).expect("parse");
        assert_eq!(parsed.name.as_deref(), Some("test-skill"));
        assert_eq!(parsed.description.as_deref(), Some("parse yaml frontmatter"));
        assert!(parsed.metadata.is_some());
        assert!(parsed.body.contains("# Body"));
        assert!(parsed.asset_dirs.scripts);
        assert!(!parsed.asset_dirs.references);
        assert!(!parsed.asset_dirs.assets);
    }

    #[test]
    fn parse_without_frontmatter() {
        let dir = test_dir("no-frontmatter");
        let content = "# Just markdown\nText";
        let parsed = parse_skill_md_content(content, &dir).expect("parse");
        assert!(parsed.name.is_none());
        assert!(parsed.description.is_none());
        assert_eq!(parsed.body, content);
    }

    #[test]
    fn parse_empty_file() {
        let dir = test_dir("empty");
        let parsed = parse_skill_md_content("", &dir).expect("parse");
        assert!(parsed.name.is_none());
        assert_eq!(parsed.body, "");
    }

    #[test]
    fn parse_frontmatter_only() {
        let dir = test_dir("frontmatter-only");
        let content = r#"---
name: only-header
description: header only
---
"#;
        let parsed = parse_skill_md_content(content, &dir).expect("parse");
        assert_eq!(parsed.name.as_deref(), Some("only-header"));
        assert_eq!(parsed.description.as_deref(), Some("header only"));
        assert_eq!(parsed.body, "");
    }
}
