"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { cn } from "@/lib/cn";

type CardSpec = { art: string; ref: string; label: string; className: string; rot: number; z: number };

const CARDS: CardSpec[] = [
  { art: "card-art-ice", ref: "4021", label: "Tide", className: "left-[-6%] top-[30%] w-[38%] sm:left-[-2%]", rot: -16, z: 1 },
  { art: "card-art-ember", ref: "1500", label: "Vow", className: "left-1/2 top-0 w-[52%] -translate-x-1/2", rot: 0, z: 3 },
  { art: "card-art-orchid", ref: "0300", label: "Pop", className: "right-[-6%] top-[30%] w-[38%] sm:right-[-2%]", rot: 16, z: 2 },
];

function PactMark() {
  return (
    <svg viewBox="0 0 64 28" className="h-6 w-14 sm:h-7 sm:w-16" aria-hidden>
      <path d="M6 22 C18 22 22 6 32 6 C42 6 46 22 58 22" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
      <circle cx="6" cy="22" r="4" fill="white" />
      <circle cx="58" cy="22" r="4" fill="white" />
      <circle cx="32" cy="6" r="3" fill="#b9a5ff" stroke="white" strokeWidth="1.5" />
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
      <span className={`absolute top-[34%] h-[18%] w-[12%] rounded-[18%] border border-white/25 bg-white/10 backdrop-blur-[2px] ${spec.rot > 0 ? "right-[8%]" : "left-[8%]"}`} />
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
