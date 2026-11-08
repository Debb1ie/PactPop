import type React from "react";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  CircleDollarSign,
  FileSignature,
  Inbox,
  KeyRound,
  Layers,
  LockKeyhole,
  Minus,
  Radar,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { ArchVisual } from "./arch-visual";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { HeroCards } from "./hero-cards";
import { FeaturePanels } from "./feature-visuals";
import { ProductMockup } from "./product-mockup";

export const FLOW = [
  { key: "Request", icon: Inbox, text: "A client describes what they need." },
  { key: "Agreement", icon: FileSignature, text: "Agents draft scope, price and milestones. You approve." },
  { key: "Delivery", icon: Layers, text: "Evidence is attached to each deliverable." },
  { key: "Approval", icon: BadgeCheck, text: "Sensitive steps wait for a human decision." },
  { key: "Payment", icon: CircleDollarSign, text: "PayPal collects payment and confirms it." },
] as const;

/* ───────── building blocks ───────── */

function Section({ children, className, band, id }: { children: ReactNode; className?: string; band?: "paper" | "ink"; id?: string }) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 py-20 sm:py-28",
        band === "paper" && "border-y border-border bg-surface",
        band === "ink" && "bg-[#0b0a0f] text-[#ecebf0]",
        className,
      )}
    >
      <div className="pp-reveal mx-auto max-w-6xl px-5 sm:px-6">{children}</div>
    </section>
  );
}

function Heading({ eyebrow, title, intro, ink, center }: { eyebrow: string; title: ReactNode; intro?: string; ink?: boolean; center?: boolean }) {
  return (
    <div className={cn("max-w-3xl", center && "mx-auto text-center")}>
      <p className={cn("text-[0.875rem] font-medium", ink ? "text-[#a79cf5]" : "text-accent")}>{eyebrow}</p>
      <h2 className="mt-2 text-balance text-[2.125rem] font-semibold leading-[1.1] tracking-[-0.035em] sm:text-[2.75rem]">{title}</h2>
      {intro && <p className={cn("mt-4 max-w-[62ch] text-[1.0625rem] leading-relaxed", ink ? "text-[#9a98a6]" : "text-muted")}>{intro}</p>}
    </div>
  );
}

/* ───────── hero ───────── */

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <HeroCards />
        <div className="mx-auto mt-6 max-w-4xl text-center sm:mt-10">
          <h1 className="animate-rise text-balance text-[2.75rem] font-bold leading-[1.02] tracking-[-0.045em] text-[#0d0d10] sm:text-[5rem]">
            Your business promises. Handled.
          </h1>
          <p className="animate-rise mx-auto mt-5 max-w-2xl text-[1.0625rem] leading-relaxed text-muted [animation-delay:80ms] sm:text-[1.25rem]">
            From the first client request to the final payment, PactPop&apos;s AI agents help you manage agreements, track deliverables, coordinate approvals, and get paid with
            confidence.
          </p>
          <div className="animate-rise mt-8 flex flex-wrap justify-center gap-3 [animation-delay:160ms]">
            <Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0d0d10] px-6 text-[0.9375rem] font-medium text-white transition hover:bg-[#2a2a30]">
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/how-it-works" className="inline-flex h-12 items-center rounded-xl border border-[#d9d9e0] bg-white px-6 text-[0.9375rem] font-medium text-[#0d0d10] transition hover:bg-[#f5f5f7]">
              See How It Works
            </Link>
          </div>
        </div>
      </div>
      <FlowStrip />
    </section>
  );
}

/** Product preview (illustration) shown under the hero. */
export function PreviewSection() {
  return (
    <section id="product" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16 sm:px-6">
      <ProductMockup />
    </section>
  );
}

/** REQUEST → AGREEMENT → DELIVERY → APPROVAL → PAYMENT. Numbered because the order is the point. */
export function FlowStrip() {
  return (
    <div className="border-y border-border bg-surface">
      <ol className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-5">
        {FLOW.map(({ key, icon: Icon }, i) => (
          <li key={key} className={cn("flex items-center gap-2.5 px-5 py-4 sm:justify-center", i > 0 && "sm:border-l sm:border-border", i % 2 === 1 && "border-l border-border")}>
            <span className="font-mono text-xs text-faint">{i + 1}</span>
            <Icon className="h-4 w-4 text-accent" />
            <span className="text-[0.875rem] font-semibold">{key}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────── problem ───────── */

export function Problem() {
  const items: [LucideIcon, string, string][] = [
    [Inbox, "Agreements live in email threads", "When a client asks for more, nobody can quickly answer what was actually agreed."],
    [Radar, "Scope creeps quietly", "Small extras add up to unpaid hours because there's no moment to pause and price them."],
    [ReceiptText, "Payment chasing is manual", "Invoices, reminders and reconciliation happen in a different tool than the work itself."],
  ];
  return (
    <Section>
      <Heading
        eyebrow="The problem"
        title="Freelancers don't lose money on the work. They lose it between the steps."
        intro="Requests, proposals, delivery and payment are usually disconnected. PactPop keeps them on one traceable record."
      />
      <div className="mt-12 grid gap-10 md:grid-cols-3">
        {items.map(([Icon, t, d]) => (
          <div key={t}>
            <Icon className="h-5 w-5 text-accent" strokeWidth={1.8} />
            <h3 className="mt-4 text-[1.125rem] font-semibold tracking-tight">{t}</h3>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{d}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────── 3D architecture ───────── */

export function ArchitectureSection() {
  return (
    <Section band="paper">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.6fr)] lg:items-center">
        <Heading
          eyebrow="Architecture"
          title="Every action passes the same checkpoints."
          intro="Requests come in through the client portal. Agents interpret them and propose actions. TrustGate decides what runs and what waits for you. PayPal moves the money, and every step lands in the ledger."
        />
        <ArchVisual />
      </div>
    </Section>
  );
}

/* ───────── how it works ───────── */

export function HowItWorks() {
  return (
    <Section band="ink">
      <Heading ink eyebrow="How PactPop works" title="One record from request to payment." intro="Every step links back to what was promised, so you can always see what changed and why." />
      <ol className="relative mt-14 grid gap-8 lg:grid-cols-5 lg:gap-6">
        <span className="absolute left-0 right-0 top-[1.15rem] hidden h-px bg-[#2a2832] lg:block" aria-hidden />
        {FLOW.map(({ key, icon: Icon, text }, i) => (
          <li key={key} className="relative">
            <span className="relative z-10 grid h-9 w-9 place-items-center rounded-full border border-[#3a3743] bg-[#0b0a0f] text-[#a79cf5]">
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-5 font-mono text-xs text-[#615f6c]">Step {i + 1}</p>
            <p className="mt-1 text-[1.125rem] font-semibold">{key}</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-[#9a98a6]">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

/* ───────── agents ───────── */

export const AGENTS: { name: string; icon: LucideIcon; text: string; authority: "Reads" | "Drafts" | "Prepares, you approve" }[] = [
  { name: "Intake", icon: Inbox, text: "Turns a client's message into requirements, budget, timeline and open questions.", authority: "Drafts" },
  { name: "Scope", icon: Radar, text: "Compares new requests against the accepted agreement.", authority: "Drafts" },
  { name: "Pricing", icon: CircleDollarSign, text: "Estimates units of work. Your rates, not the model, compute the price.", authority: "Drafts" },
  { name: "Proposal", icon: ScrollText, text: "Writes deliverables, milestones and payment terms.", authority: "Prepares, you approve" },
  { name: "ProofFlow", icon: BadgeCheck, text: "Checks delivered evidence against the acceptance criteria and flags what's missing.", authority: "Drafts" },
  { name: "PayFlow", icon: ReceiptText, text: "Prepares PayPal invoices and checkout orders, and tracks payment status.", authority: "Prepares, you approve" },
  { name: "Finance", icon: CircleDollarSign, text: "Reconciles payments and flags overdue invoices.", authority: "Reads" },
  { name: "Operations", icon: Workflow, text: "Tracks milestones and drafts reminders before deadlines slip.", authority: "Drafts" },
];

const AUTHORITY_STYLE = {
  Reads: "bg-fill text-muted",
  Drafts: "bg-accent-soft text-accent",
  "Prepares, you approve": "bg-warning-soft text-warning",
};

export function AgentsSection() {
  return (
    <Section id="agents" className="scroll-mt-24">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Heading
            eyebrow="AI agents"
            title="Eight specialists, one coordinated team."
            intro="An orchestrator routes each task to the right agent. Every tool call is permission-checked and logged, so you can see what the AI did and why."
          />
          <p className="mt-6 text-[0.9375rem] text-muted">
            Ask the <span className="font-semibold text-foreground">Command Center</span> in plain language, for example &ldquo;Which invoices are overdue?&rdquo;
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex justify-between border-b border-border bg-surface-2 px-5 py-2.5 text-[0.75rem] font-medium text-muted">
            <span>Agent</span>
            <span>Authority</span>
          </div>
          <ul className="divide-y divide-border">
            {AGENTS.map(({ name, icon: Icon, text, authority }) => (
              <li key={name} className="flex items-start gap-4 px-5 py-4">
                <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-faint" strokeWidth={1.8} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{name} Agent</p>
                  <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted">{text}</p>
                </div>
                <span className={cn("shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[0.6875rem] font-semibold", AUTHORITY_STYLE[authority])}>{authority}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

/* ───────── signature features, each shown as the document it produces ───────── */

export function IntelligenceSection() {
  return (
    <Section id="features" className="scroll-mt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
        <div>
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#5a8a3c]">Signature features</p>
          <h2 className="mt-3 text-[2.5rem] font-medium leading-[1.08] tracking-[-0.04em] sm:text-[3.5rem]">
            Built around the{" "}
            <span className="whitespace-nowrap">
              <span className="relative inline-block">
                promise
                <svg viewBox="0 0 220 24" className="absolute -bottom-3 left-0 h-5 w-full" aria-hidden preserveAspectRatio="none">
                  <path d="M4 16 C 50 4, 90 4, 120 12 S 190 22, 216 6" fill="none" stroke="#8fae6f" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </span>
              ,
            </span>{" "}
            not just the invoice
          </h2>
        </div>
        <div className="lg:pb-2">
          <p className="max-w-sm text-[0.9375rem] leading-relaxed text-muted">
            Scope control, proof checks, a linked record of every promise and approvals you control, all in one free workspace.
          </p>
          <Link
            href="/login"
            className="group mt-5 inline-flex h-14 items-center gap-6 rounded-full bg-gradient-to-b from-[#2a2a30] to-[#0d0d10] pl-6 pr-1.5 text-[0.9375rem] font-medium text-white shadow-[0_12px_30px_-14px_rgb(0_0_0/0.6)]"
          >
            Try the demo workspace
            <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-[#0d0d10] transition-transform duration-500 ease-[var(--ease-ios)] group-hover:translate-x-1">
              <ArrowRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
      </div>
      <div className="mt-12">
        <FeaturePanels />
      </div>
    </Section>
  );
}

/* ───────── PayPal ───────── */

export function PayPalSection() {
  const points = [
    ["Invoicing API", "Deposits, milestones and approved change orders are invoiced through PayPal."],
    ["Orders API", "Checkout orders are captured only after an approval."],
    ["Webhooks", "Payments count only after a verified webhook or a server-side check, never a browser redirect."],
    ["Idempotency", "Duplicate deliveries are ignored, and every event is stored with its PayPal ID."],
  ];
  return (
    <Section id="paypal" className="scroll-mt-24">
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <Heading
          eyebrow="PayPal integration"
          title="Payments are part of the agreement."
          intro="The PayFlow Agent works through PayPal's official REST APIs. Amounts come from approved milestones in your records, never from AI-generated text."
        />
        <dl className="divide-y divide-border rounded-xl border border-border bg-surface">
          {points.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-5 py-4 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-6">
              <dt className="text-[0.875rem] font-semibold">{k}</dt>
              <dd className="text-[0.9375rem] leading-relaxed text-muted">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}

/* ───────── security ───────── */

export function SecuritySection() {
  const items: [LucideIcon, string, string][] = [
    [ShieldCheck, "TrustGate permissions", "Each agent tool is allowed, needs approval, or is blocked. The server enforces it, and the AI cannot override it."],
    [KeyRound, "Secrets stay server-side", "PayPal credentials and access tokens never reach the browser."],
    [ScrollText, "Audit trail", "Sensitive actions record who or what acted, when, and what changed."],
    [LockKeyhole, "Tenant isolation", "Every query is scoped to your business account."],
  ];
  return (
    <Section band="ink" id="security" className="scroll-mt-24">
      <Heading ink eyebrow="Security & controls" title="AI that prepares. People who decide." />
      <ul className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {items.map(([Icon, t, d]) => (
          <li key={t}>
            <p className="flex items-center gap-3 text-[1.0625rem] font-semibold">
              <Icon className="h-5 w-5 text-[#a79cf5]" strokeWidth={1.8} /> {t}
            </p>
            <p className="mt-2 max-w-[48ch] text-[0.9375rem] leading-relaxed text-[#9a98a6]">{d}</p>
          </li>
        ))}
      </ul>
      <p className="mt-12 text-[0.8125rem] text-[#615f6c]">PactPop helps organise evidence and approvals. It does not provide legal advice or guarantee payment outcomes.</p>
    </Section>
  );
}

/* ───────── audience ───────── */

const AUDIENCES: { icon: LucideIcon; who: string; pain: string; gain: string }[] = [
  { icon: UserRound, who: "Freelancers", pain: "You say yes to a small extra, then another, and the project quietly doubles.", gain: "ScopeWatch catches every extra ask and prices it as a change order." },
  { icon: Briefcase, who: "Consultants", pain: "Milestones drift, and invoicing is the last thing you get to.", gain: "Milestones carry their payment terms, and invoices are prepared as work is approved." },
  { icon: Building2, who: "Small agencies", pain: "Nobody on the team knows exactly what the client agreed to.", gain: "One shared record per client, with approvals and a full evidence trail." },
];

export function AudienceSection() {
  return (
    <Section band="paper">
      <Heading eyebrow="Who it's for" title="Built for people who sell their time and expertise." />
      <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border md:grid-cols-3">
        {AUDIENCES.map(({ icon: Icon, who, pain, gain }) => (
          <div key={who} className="bg-surface p-6">
            <p className="flex items-center gap-2.5 text-[1.0625rem] font-semibold">
              <Icon className="h-[18px] w-[18px] text-accent" strokeWidth={1.8} /> {who}
            </p>
            <p className="mt-4 text-[0.8125rem] font-medium text-muted">Before</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{pain}</p>
            <p className="mt-4 text-[0.8125rem] font-medium text-accent">With PactPop</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed">{gain}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ───────── comparison ───────── */

const COMPARE: { label: string; email: string | boolean; invoicing: string | boolean; pactpop: string | boolean }[] = [
  { label: "Knows what was agreed", email: "Buried in threads", invoicing: false, pactpop: "Versioned" },
  { label: "Catches scope creep", email: false, invoicing: false, pactpop: "ScopeWatch" },
  { label: "Prices extra work from your rates", email: false, invoicing: "Manual", pactpop: true },
  { label: "Links proof of delivery to payment", email: false, invoicing: false, pactpop: "ProofFlow" },
  { label: "Collects payment", email: false, invoicing: true, pactpop: "PayPal" },
  { label: "Confirms payment automatically", email: false, invoicing: "Varies", pactpop: "Verified webhooks" },
  { label: "AI does the busywork, you approve", email: false, invoicing: false, pactpop: true },
];

function CompareCell({ v, strong }: { v: string | boolean; strong?: boolean }) {
  if (v === true) return <Check className={cn("mx-auto h-4 w-4", strong ? "text-accent" : "text-success")} aria-label="Yes" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-faint" aria-label="No" />;
  return <span className={cn("text-[0.875rem]", strong ? "font-semibold text-accent" : "text-muted")}>{v}</span>;
}

export function ComparisonSection() {
  return (
    <Section>
      <Heading eyebrow="Why switch" title="Invoicing tools bill for the work. PactPop protects it." />
      <div className="mt-12 overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[600px] text-center">
          <thead>
            <tr className="border-b border-border text-[0.8125rem] text-muted">
              <th className="px-5 py-3.5 text-left font-medium">Capability</th>
              <th className="px-4 py-3.5 font-medium">Email & spreadsheets</th>
              <th className="px-4 py-3.5 font-medium">Invoicing apps</th>
              <th className="border-l border-border bg-accent-soft px-4 py-3.5 font-semibold text-accent">PactPop</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {COMPARE.map((r) => (
              <tr key={r.label}>
                <td className="px-5 py-3.5 text-left text-[0.9375rem]">{r.label}</td>
                <td className="px-4 py-3.5">
                  <CompareCell v={r.email} />
                </td>
                <td className="px-4 py-3.5">
                  <CompareCell v={r.invoicing} />
                </td>
                <td className="border-l border-border bg-accent-soft px-4 py-3.5">
                  <CompareCell v={r.pactpop} strong />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

/* ───────── FAQ ───────── */

const FAQ = [
  ["Does PactPop move real money?", "Not in this version. PactPop runs on the PayPal Sandbox, so every invoice and payment uses test accounts."],
  [
    "Can the AI send invoices or take payments on its own?",
    "Only if you allow it. Each agent tool has a TrustGate policy. Capturing payments, refunds and changes to agreed amounts always need an owner's approval.",
  ],
  ["Where do prices come from?", "Your pricing rules. Agents estimate units of work (pages, features, hours), and PactPop's pricing engine calculates the amount, with a breakdown you can review."],
  [
    "What happens when a client asks for more?",
    "ScopeWatch compares the request with the accepted agreement, explains what's new, and drafts a change order. Nothing is charged until you and the client approve it.",
  ],
  ["Is the AI's deliverable check final?", "No. ProofFlow's verification is advisory. You or your client make the completion decision."],
  ["How much does PactPop cost?", "Nothing. PactPop is free and open source (MIT). There are no plans, trials or upgrades."],
  ["Does PactPop take a cut of my payments?", "No. Clients pay you directly through PayPal, and PayPal's standard fees apply."],
  [
    "Which AI model does it use?",
    "Anthropic's Claude by default, behind a provider interface so the model can be swapped. Without an API key, a clearly labelled rule-based mode keeps the workflow usable.",
  ],
];

export function FaqSection() {
  return (
    <Section band="paper" id="faq" className="scroll-mt-24">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
        <Heading eyebrow="FAQ" title="Questions, answered." />
        <div className="divide-y divide-border border-y border-border">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 py-5 text-[1.0625rem] font-medium">
                {q}
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border text-muted transition-transform duration-300 group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="-mt-1 max-w-[62ch] pb-5 text-[0.9375rem] leading-relaxed text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ───────── CTA: the one bold moment, an agreement stub with a signature line ───────── */

export function CtaBand() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="stub tone-violet mx-auto max-w-5xl" style={{ "--tear": "13.5rem", "--notch": "14px" } as React.CSSProperties}>
        <div className="flex h-[13.5rem] flex-col items-center justify-center px-6 text-center sm:px-12">
          <h2 className="text-balance text-[2rem] font-semibold leading-tight tracking-[-0.035em] sm:text-[3rem]">Make promises. Make progress. Get paid.</h2>
          <p className="mx-auto mt-3 max-w-xl text-[1.0625rem] text-muted">Run your next client project on PactPop. Free, open source, and built on PayPal.</p>
        </div>
        <div className="flex flex-col items-center justify-between gap-6 px-6 pb-8 pt-8 sm:flex-row sm:px-12">
          <div className="w-full max-w-xs">
            <div className="flex items-end gap-2 border-b border-foreground/50 pb-1">
              <span className="font-mono text-lg text-muted">×</span>
              <span className="font-[family-name:var(--font-brand)] text-xl italic text-accent">your business</span>
            </div>
            <p className="mt-1.5 text-xs text-muted">Signature</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register" size="lg" className="px-7">
              Get Started <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/login" size="lg" variant="outline" className="px-7">
              Try the demo
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
