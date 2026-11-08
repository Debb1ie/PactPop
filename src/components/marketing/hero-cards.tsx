"use client";

import { LogoMark } from "@/components/brand/logo";
import { useId, useRef, type CSSProperties, type PointerEvent } from "react";

import { cn } from "@/lib/cn";

type CardSpec = { art: string; ref: string; label: string; className: string; rot: number; z: number };

const CARDS: CardSpec[] = [
  { art: "card-art-ice", ref: "4021", label: "Tide", className: "left-[-6%] top-[30%] w-[38%] sm:left-[-2%]", rot: -16, z: 1 },
  { art: "card-art-ember", ref: "1500", label: "Vow", className: "left-1/2 top-0 w-[52%] -translate-x-1/2", rot: 0, z: 3 },
  { art: "card-art-orchid", ref: "0300", label: "Pop", className: "right-[-6%] top-[30%] w-[38%] sm:right-[-2%]", rot: 16, z: 2 },
];

function PactMark() {
  return <LogoMark variant="mono" className="h-7 w-7 sm:h-9 sm:w-9" title="" />;
}

/** Gold EMV-style contact chip. */
function Chip({ className }: { className?: string }) {
  const id = `chip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 50 38" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fbe7a1" />
          <stop offset="0.45" stopColor="#e1b54f" />
          <stop offset="1" stopColor="#a8792a" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="49" height="37" rx="7" fill={`url(#${id})`} stroke="#8a6220" strokeOpacity="0.5" />
      <g fill="none" stroke="#7a5418" strokeOpacity="0.55" strokeWidth="1.2">
        <path d="M0.5 13 H15 M0.5 25 H15 M35 13 H49.5 M35 25 H49.5" />
        <path d="M15 0.5 V37.5 M35 0.5 V37.5" />
        <rect x="18.5" y="9" width="13" height="20" rx="3" />
        <path d="M25 0.5 V9 M25 29 V37.5" />
      </g>
      <rect x="0.5" y="0.5" width="49" height="18" rx="7" fill="#fff" opacity="0.18" />
    </svg>
  );
}

/** One agreement card that tilts toward the pointer and lifts on hover. */
function TiltCard({ spec }: { spec: CardSpec }) {
  const el = useRef<HTMLDivElement>(null);
  const set = (vars: Record<string, string>) => {
    const node = el.current;
    if (!node) return;
    for (const [k, v] of Object.entries(vars)) node.style.setProperty(k, v);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.dataset.hover = "true";
    set({ "--ry": `${x * 18}deg`, "--rx": `${-y * 14}deg`, "--tz": "40px", "--s": "1.04", "--gx": `${(x + 0.5) * 100}%`, "--gy": `${(y + 0.5) * 100}%` });
  };
  const onLeave = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.dataset.hover = "false";
    set({ "--ry": "0deg", "--rx": "0deg", "--tz": "0px", "--s": "1" });
  };
  return (
    <div
      ref={el}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={cn(
        "hero-card absolute aspect-[1.586] overflow-hidden rounded-[7%/11%] shadow-[0_40px_80px_-30px_rgb(20_10_40/0.55)] hover:shadow-[0_60px_110px_-30px_rgb(108_78_245/0.55)]",
        spec.art,
        spec.className,
      )}
      style={{ "--rot": `${spec.rot}deg`, zIndex: spec.z } as CSSProperties}
      aria-hidden
    >
      {/* moving sheen follows the pointer */}
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_50%_at_var(--gx,50%)_var(--gy,30%),rgb(255_255_255/0.22),transparent_70%)]" />
      {/* chip */}
      {/* the right-hand card is mirrored: its left side sits behind the centre card */}
      <Chip className={`absolute top-[32%] w-[15%] ${spec.rot > 0 ? "right-[8%]" : "left-[8%]"}`} />
      <span className={`absolute bottom-[10%] font-mono text-[clamp(0.7rem,1.6vw,1.35rem)] tracking-wide text-white ${spec.rot > 0 ? "right-[26%]" : "left-[8%]"}`}>
        **** {spec.ref}
      </span>
      <span className={`absolute top-[10%] text-[clamp(0.55rem,0.9vw,0.8rem)] font-semibold uppercase tracking-[0.14em] text-white/75 ${spec.rot > 0 ? "right-[8%]" : "left-[8%]"}`}>{spec.label}</span>
      <span className="absolute bottom-[8%] right-[7%] flex flex-col items-end gap-0.5">
        <PactMark />
        <span className="font-[family-name:var(--font-brand)] text-[clamp(0.5rem,0.85vw,0.75rem)] font-semibold tracking-[0.08em] text-white/85">VowCard</span>
      </span>
    </div>
  );
}

/** Three agreement cards: centre card in front, side cards tilted outward. */
export function HeroCards() {
  return (
    <div className="relative mx-auto aspect-[2.6] w-full max-w-6xl" role="img" aria-label="PactPop agreement cards">
      {CARDS.map((c) => (
        <TiltCard key={c.ref} spec={c} />
      ))}
    </div>
  );
}
