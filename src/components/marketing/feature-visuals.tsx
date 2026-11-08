"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** ScopeWatch: five agreed page tiles, three new ones pop in, a change-order chip appears. */
function ScopeVisual() {
  const agreed = ["Home", "Menu", "About", "Catering", "Contact"];
  const extra = ["Team", "Gallery", "FAQ"];
  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-4 gap-2.5">
        {agreed.map((p) => (
          <div key={p} className="aspect-[3/4] rounded-xl bg-white p-2 shadow-[0_10px_24px_-14px_rgb(60_30_120/0.45)]">
            <div className="h-1.5 w-2/3 rounded-full bg-[#6c4ef5]/70" />
            <div className="mt-1.5 h-1 w-full rounded-full bg-[#0d0d10]/10" />
            <div className="mt-1 h-1 w-4/5 rounded-full bg-[#0d0d10]/10" />
            <p className="mt-2 truncate text-[0.6rem] font-semibold text-[#0d0d10]/60">{p}</p>
          </div>
        ))}
        {extra.map((p, i) => (
          <div
            key={p}
            className="pp-pop-in aspect-[3/4] rounded-xl border-2 border-dashed border-[#5aa61a] bg-[#d7ee6e]/60 p-2"
            style={{ animationDelay: `${0.4 + i * 0.25}s` }}
          >
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#5aa61a] text-[0.7rem] font-bold text-white">+</span>
            <p className="mt-2 truncate text-[0.6rem] font-semibold text-[#2f5a0a]">{p}</p>
          </div>
        ))}
      </div>
      <div className="pp-pop-in mx-auto mt-4 flex w-fit items-center gap-2 whitespace-nowrap rounded-full bg-[#0d0d10] px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-lg" style={{ animationDelay: "1.3s" }}>
        <span className="h-2 w-2 rounded-full bg-[#ffb340]" /> Change order <span className="money">$300</span> <span className="font-medium text-white/60">needs you</span>
      </div>
    </div>
  );
}

/** VowGraph: a chain of record nodes with a pulse travelling along it. */
function ChainVisual() {
  const nodes = ["Request", "Proposal", "Agreement", "Delivery", "Approval", "Payment"];
  return (
    <svg viewBox="-30 0 420 150" className="w-full max-w-md" role="img" aria-label="Request, proposal, agreement, delivery, approval and payment linked in a chain">
      <path id="pp-chain" d="M20 110 C70 110 70 40 120 40 S170 110 220 110 S290 40 340 40" fill="none" stroke="#6c4ef5" strokeOpacity="0.35" strokeWidth="3" strokeDasharray="6 7" />
      <circle r="6" fill="#6c4ef5">
        <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
          <mpath href="#pp-chain" />
        </animateMotion>
      </circle>
      {nodes.map((n, i) => {
        const pts = [
          [20, 110],
          [86, 62],
          [150, 62],
          [214, 108],
          [278, 64],
          [340, 40],
        ][i];
        return (
          <g key={n}>
            <circle cx={pts[0]} cy={pts[1]} r="11" fill="white" stroke="#6c4ef5" strokeWidth="3" />
            <circle cx={pts[0]} cy={pts[1]} r="4" fill={i === nodes.length - 1 ? "#1f9d61" : "#6c4ef5"} />
            <text x={pts[0]} y={pts[1] + (i % 2 === 0 ? 30 : -20)} textAnchor="middle" fontSize="11" fontWeight="600" fill="#0d0d10" fillOpacity="0.7">
              {n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** ProofFlow: progress ring plus page thumbnails with pass/fail badges. */
function ProofVisual() {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90" role="img" aria-label="7 of 8 checks passed">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#0d0d10" strokeOpacity="0.08" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1f9d61" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * 0.875} ${c}`} className="pp-ring" />
        <text x="60" y="66" textAnchor="middle" fontSize="20" fontWeight="800" fill="#0d0d10" transform="rotate(90 60 60)">
          7/8
        </text>
      </svg>
      <div className="grid grid-cols-2 gap-2">
        {[true, true, true, false].map((ok, i) => (
          <div key={i} className="relative h-14 w-12 rounded-lg bg-white p-1.5 shadow-[0_8px_18px_-12px_rgb(0_0_0/0.4)]">
            <div className="h-1 w-3/4 rounded-full bg-[#0d0d10]/15" />
            <div className="mt-1 h-5 w-full rounded bg-[#0d0d10]/[0.06]" />
            <span className={cn("absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full text-[0.65rem] font-bold text-white", ok ? "bg-[#1f9d61]" : "bg-[#e5484d]")}>
              {ok ? "✓" : "!"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** TrustGate: three switches, allow / ask / block. */
function GateVisual() {
  const rows = [
    { label: "Read invoices", state: "Allow", knob: "translate-x-7", track: "bg-[#1f9d61]" },
    { label: "Send invoice", state: "Ask me", knob: "translate-x-3.5", track: "bg-[#f0a52b]" },
    { label: "Refund", state: "Locked", knob: "translate-x-0", track: "bg-[#0d0d10]/25" },
  ];
  return (
    <div className="w-full max-w-xs space-y-3">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_10px_24px_-16px_rgb(0_0_0/0.45)]">
          <span className="flex-1 text-[0.875rem] font-semibold text-[#0d0d10]">{r.label}</span>
          <span className="text-[0.75rem] font-medium text-[#0d0d10]/55">{r.state}</span>
          <span className={cn("relative h-6 w-12 rounded-full transition-colors", r.track)}>
            <span className={cn("absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform", r.knob)} />
          </span>
        </div>
      ))}
    </div>
  );
}

/* ───────── expanding feature panels ───────── */

type Panel = { key: string; name: string; title: string; text: string; silk: string; line: string; visual: ReactNode };

const PANELS: Panel[] = [
  {
    key: "scope",
    name: "ScopeWatch",
    title: "Extra asks get caught, not absorbed.",
    text: "When a client asks for more than the agreement covers, ScopeWatch spots it and drafts a priced change order for you to approve.",
    silk: "bg-[radial-gradient(80%_70%_at_20%_10%,#cdbdf2_0%,transparent_60%),radial-gradient(70%_60%_at_90%_90%,#8f6fe0_0%,transparent_60%),linear-gradient(160deg,#b9a6e8,#7d62c9)]",
    line: "#ffffff",
    visual: <ScopeVisual />,
  },
  {
    key: "vow",
    name: "VowGraph",
    title: "Every payment traces to a promise.",
    text: "Requests, proposals, agreements, deliveries and payments stay linked, so you can always see why money moved.",
    silk: "bg-[radial-gradient(80%_70%_at_30%_0%,#ffd9a8_0%,transparent_60%),radial-gradient(70%_70%_at_80%_100%,#e8650f_0%,transparent_60%),linear-gradient(170deg,#f7b267,#e07a1f)]",
    line: "#fff3e4",
    visual: <ChainVisual />,
  },
  {
    key: "proof",
    name: "ProofFlow",
    title: "Proof checked against the promise.",
    text: "Upload the delivery and the ProofFlow agent checks it against each agreed item before the next invoice goes out.",
    silk: "bg-[radial-gradient(80%_70%_at_20%_0%,#9fc48a_0%,transparent_60%),radial-gradient(70%_70%_at_90%_100%,#2e5b26_0%,transparent_60%),linear-gradient(165deg,#6f9a5c,#3b6a32)]",
    line: "#eaf5e2",
    visual: <ProofVisual />,
  },
  {
    key: "gate",
    name: "TrustGate",
    title: "AI prepares. You decide.",
    text: "Every agent action is checked. Reading is allowed, sending waits for you, and refunds stay locked.",
    silk: "bg-[radial-gradient(80%_70%_at_30%_0%,#c9d3e6_0%,transparent_60%),radial-gradient(70%_70%_at_90%_100%,#3d4a66_0%,transparent_60%),linear-gradient(165deg,#8b97b3,#4b5878)]",
    line: "#eef2fa",
    visual: <GateVisual />,
  },
];

/** Thin flowing lines over the gradient, like folded silk. */
export function Silk({ color }: { color: string }) {
  const paths = Array.from({ length: 28 }, (_, i) => {
    const y = 40 + i * 22;
    return `M-60 ${y} C 140 ${y - 160 + i * 4}, 300 ${y + 140}, 520 ${y - 40} S 820 ${y - 120 + i * 3}, 960 ${y + 30}`;
  });
  return (
    <svg viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeOpacity={0.08 + (i % 5) * 0.025} strokeWidth="1.2" />
      ))}
    </svg>
  );
}

/** Signature features: a row of panels; the open one shows its story and live widget, the rest stand as tall strips. */
export function FeaturePanels() {
  const [open, setOpen] = useState(0);
  return (
    <div className="flex flex-col gap-3 lg:h-[36rem] lg:flex-row">
      {PANELS.map((p, i) => {
        const on = open === i;
        return (
          <div
            key={p.key}
            onMouseEnter={() => setOpen(i)}
            className={cn(
              "relative overflow-hidden rounded-[2rem] text-white transition-[flex-grow] duration-700 ease-[var(--ease-ios)] lg:min-w-[7.5rem]",
              p.silk,
              on ? "lg:flex-[5_1_0%]" : "lg:flex-[1_1_0%] lg:cursor-pointer",
            )}
          >
            <Silk color={p.line} />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

            {/* collapsed strip: vertical title */}
            <button
              type="button"
              onClick={() => setOpen(i)}
              onFocus={() => setOpen(i)}
              aria-expanded={on}
              className={cn(
                "absolute inset-0 hidden items-center justify-center transition-opacity duration-500 lg:flex",
                on ? "pointer-events-none opacity-0" : "opacity-100",
              )}
            >
              <span className="rotate-180 whitespace-nowrap text-[2rem] font-semibold tracking-[-0.03em] [writing-mode:vertical-rl]">{p.name}</span>
            </button>

            {/* open panel */}
            <div
              className={cn(
                "relative flex h-full flex-col p-6 transition-[opacity,transform] duration-700 ease-[var(--ease-ios)] sm:p-8 lg:p-9 lg:absolute lg:inset-y-0 lg:left-0 lg:w-[44rem]",
                on ? "opacity-100 lg:translate-x-0" : "lg:pointer-events-none lg:-translate-x-6 lg:opacity-0",
              )}
            >
              <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-white/75">{p.name}</p>
              <h3 className="mt-2 max-w-[16ch] text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em] sm:text-[2.5rem]">{p.title}</h3>
              <p className="mt-3 max-w-[40ch] text-[0.9375rem] leading-relaxed text-white/85">{p.text}</p>
              <div className="mt-6 flex w-full max-w-[24rem] items-center justify-center rounded-[1.6rem] bg-white p-4 text-[#0d0d10] shadow-[0_24px_50px_-24px_rgb(0_0_0/0.45)] lg:mt-auto">
                <div className="flex w-full max-w-[19rem] justify-center">{p.visual}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
