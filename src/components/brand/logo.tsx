"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * PactPop mark: the rounded, forward-leaning "P" from Poppy's bandana and card. Violet-to-blue
 * body, keyhole counter, and a lighter lavender foot.
 *
 * Variants:
 * - tile: on a deep indigo app-icon tile (rail, favicon-sized spots)
 * - mark: the gradient P alone (light or dark backgrounds)
 * - mono: a white P for colourful surfaces (VowCards)
 *
 * Ids are unique per instance (useId); a shared id breaks rendering when the first instance
 * lives inside a hidden container.
 */
export function LogoMark({ className, variant = "tile", title = "PactPop" }: { className?: string; variant?: "tile" | "mark" | "mono"; title?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const g = `pp-p-${uid}`;
  const t = `pp-t-${uid}`;
  const m = `pp-m-${uid}`;
  const body = variant === "mono" ? "#ffffff" : `url(#${g})`;
  const foot = variant === "mono" ? "#ffffff" : variant === "tile" ? "#ece2ff" : "#d7c6ff";
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} role="img" aria-label={title}>
      <defs>
        <linearGradient id={g} x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#c39bff" />
          <stop offset="0.55" stopColor="#8a72fb" />
          <stop offset="1" stopColor="#5b63f4" />
        </linearGradient>
        <linearGradient id={t} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2d2a8e" />
          <stop offset="1" stopColor="#14123f" />
        </linearGradient>
        <mask id={m}>
          <rect width="32" height="32" fill="#fff" />
          <circle cx="17.2" cy="14.6" r="2.7" fill="#000" />
          <path d="M17.2 14.6 L15.2 24" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
        </mask>
      </defs>
      {/* iOS app-icon squircle proportions */}
      {variant === "tile" && <rect width="32" height="32" rx="7.2" fill={`url(#${t})`} />}
      <g transform="translate(2.3 0) skewX(-8)">
        <path mask={`url(#${m})`} fill={body} d="M12.6 6.4 H17.6 A8.3 8.3 0 0 1 17.6 23 H16.4 V23.4 A3.8 3.8 0 0 1 8.8 23.4 V10.2 A3.8 3.8 0 0 1 12.6 6.4 Z" />
        <rect x="8.6" y="18.2" width="7.8" height="9.6" rx="3.9" fill={foot} opacity={variant === "mono" ? 0.55 : 0.9} />
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
