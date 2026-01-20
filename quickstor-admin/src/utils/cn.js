import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// This utility solves conflicts when merging Tailwind classes.
// Example: cn("bg-red-500", "bg-blue-500") -> "bg-blue-500" (last one wins correctly)
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}