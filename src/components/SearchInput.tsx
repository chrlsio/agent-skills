import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms. 0 = no debounce (instant). Default 300. */
  debounce?: number;
  /** Global keyboard shortcut to focus. Default: "k" (Cmd+K / Ctrl+K). */
  shortcutKey?: string;
}

/**
 * Reusable search input with:
 * - Built-in debounce (fires onChange after user stops typing)
 * - Clear button
 * - Cmd+K / Ctrl+K global shortcut to focus
 */
export default function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounce = 300,
  shortcutKey = "k",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [local, setLocal] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shortcutLabel = useMemo(() => {
    if (typeof navigator === "undefined") return "⌘K";
    const ua = navigator.userAgent;
    const isMac = /Mac|iPhone|iPad|iPod/i.test(ua);
    return isMac ? "⌘K" : "Ctrl+K";
  }, []);

  // Sync external value changes (e.g. cleared by parent)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  const emitChange = useCallback(
    (v: string) => {
      clearTimeout(timerRef.current);
      if (debounce <= 0) {
        onChange(v);
      } else {
        timerRef.current = setTimeout(() => onChange(v), debounce);
      }
    },
    [onChange, debounce]
  );

  function handleChange(v: string) {
    setLocal(v);
    emitChange(v);
  }

  function handleClear() {
    setLocal("");
    clearTimeout(timerRef.current);
    onChange("");
    inputRef.current?.focus();
  }

  // Global Cmd+K / Ctrl+K to focus
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === shortcutKey) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcutKey]);

  return (
    <div className="relative group">
      <input
        ref={inputRef}
        className="h-8 w-full rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.04] backdrop-blur-lg px-4 pr-8 text-sm outline-none transition-all duration-200 placeholder:text-muted-foreground/60 focus:border-primary/30 focus:ring-2 focus:ring-primary/15 focus:bg-white/60 dark:focus:bg-white/[0.06]"
        placeholder={placeholder}
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            if (local) {
              handleClear();
            } else {
              inputRef.current?.blur();
            }
          }
        }}
      />
      {local ? (
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          onClick={handleClear}
          tabIndex={-1}
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded-md glass-badge px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/50 pointer-events-none">
          {shortcutLabel}
        </kbd>
      )}
    </div>
  );
}
