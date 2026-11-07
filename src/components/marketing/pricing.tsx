"use client";

import { useState } from "react";
import { Check, Minus, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/money";
import { AI_ACTION_PACK, annualSavingsMinor, PLAN_MATRIX, PLANS } from "@/lib/plans";

function whole(minor: number) {
  return formatMoney(minor).replace(/\.00$/, "");
}

export function PricingPlans({ showMatrix = false }: { showMatrix?: boolean }) {
  const [annual, setAnnual] = useState(true);
  return (
    <div>
      <div className="flex justify-center">
        <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-border bg-surface p-1 text-sm">
          {[
            { v: false, l: "Monthly" },
            { v: true, l: "Annual" },
          ].map((o) => (
            <button
              key={o.l}
              role="radio"
              aria-checked={annual === o.v}
              onClick={() => setAnnual(o.v)}
              className={cn("rounded-full px-4 py-1.5 font-medium transition-colors", annual === o.v ? "bg-accent text-white" : "text-muted hover:text-foreground")}
            >
              {o.l}
              {o.v && <span className={cn("ml-1.5 text-xs", annual ? "text-white/85" : "text-success")}>2 months free</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {PLANS.map((p) => {
          const price = annual ? p.annualMonthlyMinor : p.monthlyMinor;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-surface p-7",
                p.featured ? "border-accent shadow-[0_24px_60px_-24px_rgb(118_86_232/0.55)] ring-1 ring-accent lg:-translate-y-2" : "border-border",
              )}
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                  <Sparkles className="h-3.5 w-3.5" /> Most popular
                </span>
              )}
              <p className="font-display text-lg font-semibold">{p.name}</p>
              <p className="mt-1 min-h-10 text-sm text-muted">{p.tagline}</p>
              <div className="mt-5 flex items-end gap-1.5">
                <span className="money text-[2.6rem] font-semibold leading-none">{whole(price)}</span>
                <span className="pb-1 text-sm text-muted">{price === 0 ? "forever" : "/ month"}</span>
              </div>
              <p className="mt-2 h-5 text-xs text-muted">
                {price === 0
                  ? "No card required"
                  : annual
                    ? `Billed ${whole(price * 12)} yearly · save ${whole(annualSavingsMinor(p))}`
                    : `or ${whole(p.annualMonthlyMinor)}/mo billed yearly`}
              </p>
              <ButtonLink href={`/register?plan=${p.id}`} variant={p.featured ? "primary" : "outline"} className="mt-6 w-full" size="lg">
                {p.cta}
              </ButtonLink>
              <ul className="mt-7 space-y-3 text-sm">
                {p.highlights.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-dashed border-border-strong bg-surface/60 px-6 py-4 text-sm sm:flex-row">
        <p>
          <span className="font-semibold">Need more AI?</span> <span className="text-muted">Add {AI_ACTION_PACK.actions.toLocaleString()} agent actions to any plan.</span>
        </p>
        <span className="money font-semibold">{whole(AI_ACTION_PACK.priceMinor)} / pack</span>
      </div>
      <p className="mt-4 text-center text-xs text-muted">
        PactPop is in beta. Plans aren&apos;t billed yet; prices shown are what paid plans will cost at launch.
      </p>

      {showMatrix && <PlanMatrix />}
    </div>
  );
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-accent" aria-label="Included" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-muted/50" aria-label="Not included" />;
  return <span className="text-sm">{v}</span>;
}

function PlanMatrix() {
  return (
    <div className="mt-16">
      <h3 className="text-center text-2xl font-semibold">Compare plans</h3>
      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-4 font-medium text-muted">Feature</th>
              {PLANS.map((p) => (
                <th key={p.id} className={cn("px-5 py-4 text-center font-display font-semibold", p.featured && "text-accent")}>
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          {PLAN_MATRIX.map((g) => (
            <tbody key={g.group}>
              <tr>
                <td colSpan={4} className="bg-surface-2/70 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {g.group}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="px-5 py-3">{r.label}</td>
                  {PLANS.map((p) => (
                    <td key={p.id} className={cn("px-5 py-3 text-center", p.featured && "bg-accent-soft/40")}>
                      <Cell v={r.values[p.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
