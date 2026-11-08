import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** A bento tile: tinted background, visual on top, short label + headline below. */
function Tile({ tint, name, title, children, className }: { tint: string; name: string; title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("group relative flex flex-col overflow-hidden rounded-[1.75rem] p-6 sm:p-7", tint, className)}>
      <div className="relative flex min-h-[13rem] flex-1 items-center justify-center">{children}</div>
      <p className="mt-6 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-[#0d0d10]/55">{name}</p>
      <p className="mt-1 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-[#0d0d10]">{title}</p>
    </div>
  );
}

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
      <div className="pp-pop-in mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-[#0d0d10] px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-lg" style={{ animationDelay: "1.3s" }}>
        <span className="h-2 w-2 rounded-full bg-[#ffb340]" /> Change order · <span className="money">$300.00</span> · waiting for you
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

/** Signature features as a visual bento grid. */
export function FeatureBento() {
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Tile tint="bg-[#f1ecff]" name="ScopeWatch" title="Extra asks get caught, not absorbed." className="lg:col-span-3">
        <ScopeVisual />
      </Tile>
      <Tile tint="bg-[#fff1e6]" name="VowGraph" title="Every payment traces to a promise." className="lg:col-span-2">
        <ChainVisual />
      </Tile>
      <Tile tint="bg-[#e7f7ef]" name="ProofFlow" title="Proof checked against the promise." className="lg:col-span-2">
        <ProofVisual />
      </Tile>
      <Tile tint="bg-[#f4f7dc]" name="TrustGate" title="AI prepares. You decide." className="lg:col-span-3">
        <GateVisual />
      </Tile>
    </div>
  );
}
