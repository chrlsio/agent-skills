import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Loader2, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddRepo } from "@/hooks/useRepos";

export default function ImportRepoDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const addRepo = useAddRepo();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !addRepo.isPending) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, addRepo.isPending]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    try {
      await addRepo.mutateAsync(url.trim());
      onClose();
    } catch (err) {
      // error is shown via addRepo.error
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 dark:bg-black/40 animate-backdrop-in"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-repo-dialog-title"
        className="w-full max-w-md rounded-3xl p-6 space-y-4 outline-none animate-modal-in glass-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4" />
            <h2 id="import-repo-dialog-title" className="text-sm font-semibold">
              {t("repos.importRepo")}
            </h2>
          </div>
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">{t("repos.importDescription")}</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/user/skills-repo.git"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
            disabled={addRepo.isPending}
          />

          {addRepo.error && (
            <p className="text-xs text-destructive">
              {addRepo.error instanceof Error ? addRepo.error.message : String(addRepo.error)}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={addRepo.isPending}>
              {t("repos.cancel")}
            </Button>
            <Button size="sm" type="submit" disabled={!url.trim() || addRepo.isPending}>
              {addRepo.isPending ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  {t("repos.cloning")}
                </>
              ) : (
                t("repos.add")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
