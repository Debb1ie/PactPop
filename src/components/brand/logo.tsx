"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * PactPop mark: two vow nodes joined by a tide arc that meets at a central agreement point,
 * with a small "pop" burst marking completion.
 *
 * The gradient id is unique per instance (useId) — a shared id breaks rendering when the first
 * instance lives inside a hidden container.
 */
export function LogoMark({ className, variant = "tile", title = "PactPop" }: { className?: string; variant?: "tile" | "mark"; title?: string }) {
  const gid = `pp-tile-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stroke = variant === "tile" ? "#ffffff" : "currentColor";
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} role="img" aria-label={title}>
      {variant === "tile" && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8f72f6" />
              <stop offset="1" stopColor="#5b3cd4" />
            </linearGradient>
          </defs>
          {/* iOS app-icon squircle proportions */}
          <rect width="32" height="32" rx="7.2" fill={`url(#${gid})`} />
        </>
      )}
      <path d="M7.5 21 C11 21 12.4 14.2 16 14.2 C19.6 14.2 21 21 24.5 21" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="7.5" cy="21" r="3" fill={stroke} />
      <circle cx="24.5" cy="21" r="3" fill={stroke} />
      <circle cx="16" cy="14.2" r="2.6" fill="#b9a5ff" stroke={stroke} strokeWidth="1.4" />
      <g stroke={variant === "tile" ? "#f1ecff" : "#b9a5ff"} strokeWidth="1.6" strokeLinecap="round">
        <path d="M16 9.2 V7.2" />
        <path d="M12.3 10.4 L11 8.9" />
        <path d="M19.7 10.4 L21 8.9" />
      </g>
    </svg>
  );
}

export function Logo({ className, tone = "auto", size = "md" }: { className?: string; tone?: "auto" | "light" | "dark"; size?: "sm" | "md" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={size === "sm" ? "h-7 w-7" : "h-8 w-8"} />
      <span
        className={cn(
          "font-[family-name:var(--font-brand)] font-semibold tracking-tight",
          size === "sm" ? "text-[1.05rem]" : "text-[1.15rem]",
          tone === "light" && "text-white",
          tone === "dark" && "text-ink",
          tone === "auto" && "text-foreground",
        )}
      >
        Pact<span className="text-accent">Pop</span>
      </span>
    </span>
  );
}
