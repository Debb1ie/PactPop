"use client";

import { useEffect, useState } from "react";
import { Bot, CircleDollarSign, Inbox, ScrollText, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type Step = { key: string; label: string; icon: LucideIcon; tile: string; app: string; title: string; body: string };

const STEPS: Step[] = [
  { key: "portal", label: "Client portal", icon: Inbox, tile: "from-[#5ac8fa] to-[#007aff]", app: "Client portal", title: "New request · Northwind Bakery", body: "5-page website with menu and catering pages." },
  { key: "agents", label: "AI agents", icon: Bot, tile: "from-[#b18cff] to-[#6c4ef5]", app: "AI agents", title: "Proposal drafted · $1,500", body: "Scope, Pricing and Proposal agents finished. 8 roles available." },
  { key: "gate", label: "TrustGate", icon: ShieldCheck, tile: "from-[#ffcc4d] to-[#ff9500]", app: "TrustGate", title: "Send invoice? · waiting for you", body: "Sensitive action. Allow, ask or block, never skipped." },
  { key: "paypal", label: "PayPal", icon: CircleDollarSign, tile: "from-[#4fa3ff] to-[#0a3d91]", app: "PayPal Sandbox", title: "Deposit paid · $750.00", body: "Confirmed by a verified webhook, not by the AI." },
  { key: "ledger", label: "Ledger", icon: ScrollText, tile: "from-[#5ee08a] to-[#24a148]", app: "Ledger", title: "Recorded · audit trail", body: "Timeline, evidence and audit entry saved." },
];

/** iOS-style architecture: a dock of app icons; the active layer magnifies and posts a notification. */
export function ArchVisual() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % STEPS.length), 2600);
    return () => window.clearInterval(t);
  }, [paused]);

  const s = STEPS[active];
  return (
    <div
      className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(120%_90%_at_10%_0%,#e9e2ff_0%,transparent_55%),radial-gradient(90%_80%_at_100%_100%,#ffe4d1_0%,transparent_55%),linear-gradient(180deg,#f7f6fb,#eef0f6)] p-6 sm:p-8"
      onMouseLeave={() => setPaused(false)}
    >
      {/* notification banner */}
      <div className="mx-auto max-w-md" aria-live="polite">
        <div key={s.key} className="pp-banner flex items-start gap-3 rounded-[1.4rem] bg-white/75 p-3.5 shadow-[0_20px_40px_-24px_rgb(30_20_80/0.45)] ring-1 ring-black/5 backdrop-blur-xl">
          <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-[0.7rem] bg-gradient-to-b text-white", s.tile)}>
            <s.icon className="h-5 w-5" strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] text-[#0d0d10]/50">{s.app}</p>
              <p className="text-[0.75rem] text-[#0d0d10]/40">now</p>
            </div>
            <p className="text-[0.9375rem] font-semibold text-[#0d0d10]">{s.title}</p>
            <p className="text-[0.8125rem] leading-snug text-[#0d0d10]/60">{s.body}</p>
          </div>
        </div>
      </div>

      {/* dock */}
      <div className="mt-10 flex justify-center">
        <div className="relative flex items-start gap-0.5 rounded-[1.75rem] bg-white/55 px-3 pb-2.5 pt-5 shadow-[0_24px_50px_-30px_rgb(30_20_80/0.5)] ring-1 ring-white/70 backdrop-blur-2xl sm:gap-2 sm:px-4">
          {STEPS.map((st, i) => {
            const on = i === active;
            const near = Math.abs(i - active) === 1;
            return (
              <button
                key={st.key}
                type="button"
                onMouseEnter={() => {
                  setPaused(true);
                  setActive(i);
                }}
                onFocus={() => {
                  setPaused(true);
                  setActive(i);
                }}
                aria-pressed={on}
                aria-label={st.label}
                className="group flex flex-col items-center outline-none"
              >
                <span
                  className={cn(
                    "grid h-12 w-12 origin-bottom place-items-center rounded-[0.95rem] bg-gradient-to-b text-white shadow-[0_10px_18px_-10px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.35)] transition-transform duration-500 ease-[var(--ease-ios)] group-focus-visible:ring-2 group-focus-visible:ring-[#6c4ef5] sm:h-14 sm:w-14 sm:rounded-[1.05rem]",
                    st.tile,
                    on ? "-translate-y-2 scale-[1.32]" : near ? "-translate-y-0.5 scale-[1.1]" : "scale-100",
                  )}
                >
                  <st.icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
                </span>
                <span className={cn("mt-2 h-1 w-1 rounded-full transition-opacity duration-300", on ? "bg-[#0d0d10]/50 opacity-100" : "opacity-0")} />
                <span className={cn("mt-1 w-14 text-center text-[0.6875rem] font-medium leading-tight transition-colors duration-300 sm:w-[4.5rem] sm:text-[0.75rem]", on ? "text-[#0d0d10]" : "text-[#0d0d10]/45")}>
                  {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mx-auto mt-5 h-1 max-w-xs overflow-hidden rounded-full bg-[#0d0d10]/[0.07]">
        <div className="h-full rounded-full bg-[#0d0d10]/70 transition-[width] duration-700 ease-[var(--ease-ios)]" style={{ width: `${((active + 1) / STEPS.length) * 100}%` }} />
      </div>
    </div>
  );
}
