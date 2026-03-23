import { memo, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { Button } from "@/components/ui/button";

type AgentRowStatus = "installed" | "inherited" | "not-installed";

interface AgentRowProps {
  name: string;
  status: AgentRowStatus;
  path?: string;
  /** Extra tags after agent name (e.g. "via X", "symlink") */
  tags?: ReactNode;
  /** Right-side action slot — if not provided, renders default uninstall/install buttons */
  action?: ReactNode;
  /** Uninstall handler — shown when status is "installed" and no custom action */
  onUninstall?: () => void;
  /** Install handler — shown when status is "not-installed" and no custom action */
  onInstall?: () => void;
  /** Labels */
  uninstallTitle?: string;
  installLabel?: string;
  installTitle?: string;
  revealTitle?: string;
  disabled?: boolean;
}

export const AgentRow = memo(function AgentRow({
  name,
  status,
  path,
  tags,
  action,
  onUninstall,
  onInstall,
  uninstallTitle,
  installLabel = "Install",
  installTitle,
  revealTitle,
  disabled,
}: AgentRowProps) {
  const isInstalled = status === "installed";
  const isInherited = status === "inherited";
  const isActive = isInstalled || isInherited;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-colors ${
        isInstalled
          ? "glass-inset"
          : isInherited
            ? "glass-inset opacity-70"
            : "bg-black/[0.02] dark:bg-white/[0.02] border border-transparent"
      }`}
    >
      {/* Left: name + path */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`size-1.5 rounded-full shrink-0 ${
              isInstalled
                ? "bg-green-500"
                : isInherited
                  ? "bg-blue-400"
                  : "bg-muted-foreground/30"
            }`}
          />
          <span className={isActive ? "font-medium truncate" : "text-muted-foreground truncate"}>
            {name}
          </span>
          {tags}
        </div>
        {path && (
          <button
            className="text-[10px] text-muted-foreground/70 hover:text-primary font-mono mt-1 pl-[14px] break-all text-left leading-relaxed transition-colors cursor-pointer"
            title={revealTitle}
            onClick={() => revealItemInDir(path)}
          >
            {path}
          </button>
        )}
      </div>
      {/* Right: action */}
      {action ?? (
        isInstalled && onUninstall ? (
          <button
            className="flex items-center justify-center size-6 rounded-md text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
            title={uninstallTitle}
            disabled={disabled}
            onClick={onUninstall}
          >
            <Trash2 className="size-3" aria-hidden="true" />
          </button>
        ) : !isActive && onInstall ? (
          <Button
            variant="outline"
            size="xs"
            className="shrink-0 h-5 px-2 text-[10px]"
            title={installTitle}
            disabled={disabled}
            onClick={onInstall}
          >
            {installLabel}
          </Button>
        ) : null
      )}
    </div>
  );
});
