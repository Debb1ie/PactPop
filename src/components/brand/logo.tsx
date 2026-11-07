import { cn } from "@/lib/cn";

/**
 * PactPop mark: two vow nodes joined by a tide arc that meets at a central agreement point,
 * with a small "pop" burst marking completion.
 *
 * Variants: "tile" (app icon / favicon / sidebar), "mark" (glyph only, inherits currentColor).
 */
export function LogoMark({ className, variant = "tile", title = "PactPop" }: { className?: string; variant?: "tile" | "mark"; title?: string }) {
  const stroke = variant === "tile" ? "#ffffff" : "currentColor";
  return (
    <svg viewBox="0 0 32 32" className={cn("shrink-0", className)} role="img" aria-label={title}>
      {variant === "tile" && (
        <>
          <defs>
            <linearGradient id="pp-tile" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8a6cf2" />
              <stop offset="1" stopColor="#5f3fd6" />
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="9" fill="url(#pp-tile)" />
        </>
      )}
      {/* tide arc */}
      <path d="M7.5 21 C11 21 12.4 14.2 16 14.2 C19.6 14.2 21 21 24.5 21" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" />
      {/* vow nodes */}
      <circle cx="7.5" cy="21" r="3" fill={stroke} />
      <circle cx="24.5" cy="21" r="3" fill={stroke} />
      {/* agreement point */}
      <circle cx="16" cy="14.2" r="2.6" fill="#b9a5ff" stroke={stroke} strokeWidth="1.4" />
      {/* pop */}
      <g stroke={variant === "tile" ? "#f1ecff" : "#b9a5ff"} strokeWidth="1.6" strokeLinecap="round">
        <path d="M16 9.2 V7.2" />
        <path d="M12.3 10.4 L11 8.9" />
        <path d="M19.7 10.4 L21 8.9" />
      </g>
    </svg>
  );
}

export function Logo({ className, tone = "auto" }: { className?: string; tone?: "auto" | "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8" />
      <span
        className={cn(
          "font-display text-[1.2rem] font-semibold tracking-tight",
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
