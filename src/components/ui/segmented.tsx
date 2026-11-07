"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** iOS UISegmentedControl: a sliding white "thumb" on a gray track. */
export function Segmented<T extends string | number | boolean>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "md" | "lg";
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div role="radiogroup" aria-label={label} className={cn("relative inline-grid rounded-[0.7rem] border border-border bg-fill p-[2px]", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      <span
        aria-hidden
        className="absolute bottom-[2px] top-[2px] rounded-[0.5rem] bg-accent transition-transform duration-300 ease-[var(--ease-ios)]"
        style={{ width: `calc((100% - 4px) / ${options.length})`, transform: `translateX(calc(${idx} * 100%))`, left: 2 }}
      />
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "relative z-10 whitespace-nowrap rounded-[0.5rem] px-4 font-medium transition-colors",
            size === "lg" ? "h-9 text-[0.9375rem]" : "h-7 text-[0.8125rem]",
            o.value === value ? "text-white" : "text-muted hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
