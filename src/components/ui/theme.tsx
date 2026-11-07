"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

const KEY = "pactpop-theme";

/**
 * Inline, render-blocking script: applies the theme before first paint to avoid a flash.
 * Dark is the default; a saved choice wins.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem('${KEY}');document.documentElement.classList.toggle('dark',t!=='light')}catch(e){document.documentElement.classList.add('dark')}})()`;

export function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  try {
    localStorage.setItem(KEY, next ? "dark" : "light");
  } catch {}
}

/** Stateless: the visible icon follows the `.dark` class via CSS, so there's no hydration mismatch. */
export function ThemeToggle({ className, boxed }: { className?: string; boxed?: boolean }) {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      className={cn(
        "grid h-10 w-10 place-items-center text-muted transition-colors hover:text-foreground",
        boxed ? "rounded-xl border border-border bg-surface hover:bg-surface-2" : "rounded-full hover:bg-fill",
        className,
      )}
    >
      <Moon className="h-[18px] w-[18px] dark:hidden" />
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
