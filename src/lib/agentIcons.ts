import type { ComponentType, SVGProps } from "react";

import {
  ClaudeCode,
  Cursor,
  Windsurf,
  GithubCopilot,
  Codex,
  Gemini,
  Cline,
  Trae,
  OpenCode,
  OpenClaw,
  Antigravity,
} from "@lobehub/icons";

// Fallback SVGs for icons not available in @lobehub/icons
import kiroSvg from "@/assets/agents/kiro.svg";
import codebuddySvg from "@/assets/agents/codebuddy.svg";
import defaultSvg from "@/assets/agents/default.svg";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;

// Use Color variant when available, otherwise Mono (default export)
const AGENT_ICONS: Record<string, IconComponent> = {
  "claude-code": ClaudeCode.Color,
  "cursor": Cursor,
  "windsurf": Windsurf,
  "copilot-cli": GithubCopilot,
  "codex": Codex.Color,
  "gemini-cli": Gemini.Color,
  "cline": Cline,
  "trae": Trae.Color,
  "opencode": OpenCode,
  "openclaw": OpenClaw.Color,
  "antigravity": Antigravity.Color,
};

// Static SVG fallback icons (img src)
const AGENT_FALLBACK_ICONS: Record<string, string> = {
  "kiro": kiroSvg,
  "codebuddy": codebuddySvg,
};

export function getAgentIcon(slug: string): { type: "component"; Component: IconComponent } | { type: "img"; src: string } {
  const component = AGENT_ICONS[slug];
  if (component) return { type: "component", Component: component };

  const fallback = AGENT_FALLBACK_ICONS[slug];
  if (fallback) return { type: "img", src: fallback };

  return { type: "img", src: defaultSvg };
}
