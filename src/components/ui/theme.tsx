"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

const KEY = "pactpop-theme";

/** Inline, render-blocking script: applies the theme before first paint to avoid a flash. */
export const themeScript = `(function(){try{var t=localStorage.getItem('${KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

/** Stateless: the visible icon follows the `.dark` class via CSS, so there's no hydration mismatch. */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {}
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn("grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-foreground", className)}
    >
      <Moon className="h-[18px] w-[18px] dark:hidden" />
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
