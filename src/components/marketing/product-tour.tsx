"use client";

import { useState } from "react";
import { BadgeCheck, CircleDollarSign, FileSignature, Inbox, Radar } from "lucide-react";
import { cn } from "@/lib/cn";

/** Illustrated walkthrough of the demo scenario (marketing illustration, not live data). */
const STEPS = [
  {
    key: "request",
    label: "Request",
    icon: Inbox,
    agent: "Intake Agent",
    title: "A client message becomes a structured brief",
    body: "Daniel from Northwind Bakery wants a 5-page site, mobile-first, with basic SEO, for about $1,500 in two weeks. The Intake Agent pulls that out and flags what's still missing.",
    panel: [
      ["Project type", "Website redesign"],
      ["Pages", "Home, Menu, About, Catering, Contact"],
      ["Budget", "$1,500"],
      ["Timeline", "14 days"],
      ["Missing", "Who supplies photos and copy?"],
    ],
  },
  {
    key: "proposal",
    label: "Proposal",
    icon: FileSignature,
    agent: "Pricing + Proposal Agents",
    title: "A priced proposal from your own rates",
    body: "The Pricing Agent counts the work; your rate card sets the price. The Proposal Agent drafts scope, exclusions and a 50% deposit. You approve before anything is sent.",
    panel: [
      ["5 pages × $200", "$1,000.00"],
      ["Responsive design · 3h", "$300.00"],
      ["Basic SEO · 2h", "$200.00"],
      ["Total", "$1,500.00"],
      ["Deposit due on acceptance", "$750.00"],
    ],
  },
  {
    key: "payment",
    label: "Deposit",
    icon: CircleDollarSign,
    agent: "Payment Agent",
    title: "The deposit invoice goes out through PayPal",
    body: "Once the client accepts, the Payment Agent creates a PayPal invoice for the deposit. The commitment is marked paid only after PayPal confirms it with a verified webhook.",
    panel: [
      ["Invoice", "PayPal · $750.00"],
      ["Status", "Paid · verified by webhook"],
      ["Commitment", "In progress"],
      ["Balance remaining", "$750.00"],
    ],
  },
  {
    key: "scope",
    label: "ScopeWatch",
    icon: Radar,
    agent: "Scope Agent",
    title: "Extra asks are caught, not absorbed",
    body: "In week two Daniel asks for three more pages. ScopeWatch checks the accepted scope, explains why they're new work, and prepares a change order for you to approve.",
    panel: [
      ["Agreed scope", "5 pages"],
      ["New request", "+ Team, Gallery, FAQ pages"],
      ["Verdict", "Outside agreed scope"],
      ["Change order", "3 × $100 = $300.00"],
      ["Status", "Waiting for your approval"],
    ],
  },
  {
    key: "proof",
    label: "Delivery",
    icon: BadgeCheck,
    agent: "ProofFlow",
    title: "Proof checked against what was promised",
    body: "You attach the staging link and screenshots. ProofFlow compares them with the acceptance criteria and shows what's covered and what's missing. The final sign-off is still yours.",
    panel: [
      ["8 / 8 pages", "Delivered"],
      ["Mobile layout", "Evidence attached"],
      ["SEO meta tags", "Missing on 2 pages"],
      ["Final invoice", "Ready once approved"],
    ],
  },
];

export function ProductTour() {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  const Icon = step.icon;
  return (
    <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
      <div className="max-w-2xl">
        <p className="text-[0.9375rem] font-semibold text-accent">See it work</p>
        <h2 className="mt-2 text-[2.25rem] font-semibold leading-tight sm:text-[3rem]">One project, from &ldquo;hi&rdquo; to paid.</h2>
        <p className="mt-4 text-lg text-muted">Follow a real-sized engagement through PactPop: a $1,500 website redesign that grows by $300.</p>
      </div>
      <div className="mt-10 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Product tour">
        {STEPS.map((s, i) => {
          const I = s.icon;
          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={i === active}
              onClick={() => setActive(i)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all",
                i === active
                  ? "border-transparent bg-gradient-to-r from-white to-[#d9d4ff] text-[#111118] shadow-[0_8px_24px_-10px_rgb(108_92_255/0.8)]"
                  : "border-border bg-fill text-muted hover:text-foreground",
              )}
            >
              <span className="money text-xs opacity-70">0{i + 1}</span>
              <I className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </div>
      <div key={step.key} role="tabpanel" className="glass animate-rise mt-6 grid gap-6 rounded-[2rem] border border-border p-6 shadow-[var(--shadow-card)] sm:p-8 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            <Icon className="h-3.5 w-3.5" /> {step.agent}
          </span>
          <h3 className="mt-4 text-2xl font-semibold">{step.title}</h3>
          <p className="mt-3 leading-relaxed text-muted">{step.body}</p>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActive((a) => Math.max(0, a - 1))}
              disabled={active === 0}
              className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-fill disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={() => setActive((a) => Math.min(STEPS.length - 1, a + 1))}
              disabled={active === STEPS.length - 1}
              className="rounded-xl bg-gradient-to-b from-[#7d70ff] to-[#5a4af2] px-3 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-40"
            >
              Next step
            </button>
          </div>
        </div>
        <div className="glow-card glow-ice rounded-2xl p-5">
          <p className="muted-ink text-xs font-semibold uppercase tracking-wide">Northwind Bakery · Website redesign</p>
          <dl className="mt-4 divide-y divide-black/10">
            {step.panel.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
                <dt className="muted-ink">{k}</dt>
                <dd className="money text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Illustrative walkthrough of the PactPop demo scenario.</p>
    </section>
  );
}
