import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Native `<select>` styling aligned with `SearchInput` / form controls */
export const nativeSelectClass =
  "h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring";
