import { useCallback, useEffect, useState } from "react";

export interface AccentPreset {
  key: string;
  label: string;
  /** CSS color for the swatch preview */
  swatch: string;
  light: { primary: string; primaryForeground: string; ring: string };
  dark:  { primary: string; primaryForeground: string; ring: string };
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    key: "indigo",
    label: "Indigo",
    swatch: "oklch(0.55 0.24 270)",
    light: { primary: "oklch(0.55 0.24 270)", primaryForeground: "oklch(0.99 0.005 270)", ring: "oklch(0.55 0.24 270)" },
    dark:  { primary: "oklch(0.72 0.18 270)", primaryForeground: "oklch(0.10 0.015 270)", ring: "oklch(0.72 0.18 270)" },
  },
  {
    key: "coral",
    label: "Coral",
    swatch: "oklch(0.65 0.20 25)",
    light: { primary: "oklch(0.65 0.20 25)", primaryForeground: "oklch(0.99 0.005 25)", ring: "oklch(0.65 0.20 25)" },
    dark:  { primary: "oklch(0.75 0.16 25)", primaryForeground: "oklch(0.12 0.02 25)", ring: "oklch(0.75 0.16 25)" },
  },
  {
    key: "teal",
    label: "Teal",
    swatch: "oklch(0.58 0.15 185)",
    light: { primary: "oklch(0.58 0.15 185)", primaryForeground: "oklch(0.99 0.005 185)", ring: "oklch(0.58 0.15 185)" },
    dark:  { primary: "oklch(0.72 0.12 185)", primaryForeground: "oklch(0.10 0.015 185)", ring: "oklch(0.72 0.12 185)" },
  },
  {
    key: "amber",
    label: "Amber",
    swatch: "oklch(0.70 0.16 75)",
    light: { primary: "oklch(0.70 0.16 75)", primaryForeground: "oklch(0.18 0.03 75)", ring: "oklch(0.70 0.16 75)" },
    dark:  { primary: "oklch(0.78 0.14 75)", primaryForeground: "oklch(0.15 0.025 75)", ring: "oklch(0.78 0.14 75)" },
  },
  {
    key: "rose",
    label: "Rose",
    swatch: "oklch(0.62 0.20 350)",
    light: { primary: "oklch(0.62 0.20 350)", primaryForeground: "oklch(0.99 0.005 350)", ring: "oklch(0.62 0.20 350)" },
    dark:  { primary: "oklch(0.75 0.15 350)", primaryForeground: "oklch(0.12 0.02 350)", ring: "oklch(0.75 0.15 350)" },
  },
  {
    key: "mono",
    label: "Mono",
    swatch: "oklch(0.25 0 0)",
    light: { primary: "oklch(0.25 0 0)", primaryForeground: "oklch(0.99 0 0)", ring: "oklch(0.25 0 0)" },
    dark:  { primary: "oklch(0.90 0 0)", primaryForeground: "oklch(0.12 0 0)", ring: "oklch(0.90 0 0)" },
  },
];

const STORAGE_KEY = "accent-color";

function applyAccent(key: string) {
  const preset = ACCENT_PRESETS.find((p) => p.key === key) ?? ACCENT_PRESETS[0];
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const vars = isDark ? preset.dark : preset.light;
  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--primary-foreground", vars.primaryForeground);
  root.style.setProperty("--ring", vars.ring);
  // Also update sidebar-primary to match
  root.style.setProperty("--sidebar-primary", vars.primary);
  root.style.setProperty("--sidebar-primary-foreground", vars.primaryForeground);
  root.style.setProperty("--sidebar-ring", vars.ring);
}

export function useAccentColor() {
  const [accent, setAccentState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? "indigo";
  });

  const setAccent = useCallback((key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    setAccentState(key);
    applyAccent(key);
  }, []);

  // Apply on mount and whenever dark mode toggles
  useEffect(() => {
    applyAccent(accent);

    // Re-apply when dark class changes (MutationObserver)
    const observer = new MutationObserver(() => {
      applyAccent(accent);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [accent]);

  return { accent, setAccent, presets: ACCENT_PRESETS } as const;
}
