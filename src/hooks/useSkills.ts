import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export interface SkillInstallation {
  agent_slug: string;
  path: string;
  is_symlink: boolean;
  is_inherited: boolean;
  inherited_from: string | null;
}

export type SkillScope =
  | { type: "SharedGlobal" }
  | { type: "AgentLocal"; agent: string };

export interface Skill {
  id: string;
  name: string;
  description: string | null;
  canonical_path: string;
  source: unknown;
  metadata: unknown;
  collection: string | null;
  scope: SkillScope;
  installations: SkillInstallation[];
}

/** Direct (non-inherited) agent slugs */
export function installedAgents(skill: Skill): string[] {
  return skill.installations
    .filter((i) => !i.is_inherited)
    .map((i) => i.agent_slug);
}

/** All agent slugs including inherited */
export function allAgents(skill: Skill): string[] {
  return skill.installations.map((i) => i.agent_slug);
}

/** Get the install path for a specific agent */
export function agentPath(skill: Skill, agentSlug: string): string | undefined {
  return skill.installations.find((i) => i.agent_slug === agentSlug)?.path;
}

export function useSkills() {
  return useQuery<Skill[]>({
    queryKey: ["skills"],
    queryFn: () => invoke("scan_all_skills"),
    staleTime: 30 * 1000, // filesystem scan is cheap but avoid on every mount
  });
}

export function useAgentSkills(agentSlug: string) {
  return useQuery<Skill[]>({
    queryKey: ["skills", agentSlug],
    queryFn: () => invoke("scan_agent_skills", { agentSlug }),
    enabled: !!agentSlug,
    staleTime: 30 * 1000,
  });
}
