import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Briefcase,
  Building2,
  UserRound,
  CircleDollarSign,
  FileSearch,
  FileSignature,
  GitBranch,
  Inbox,
  KeyRound,
  Layers,
  LockKeyhole,
  Radar,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PricingPlans } from "./pricing";

export const FLOW = [
  { key: "Request", icon: Inbox, text: "A client describes what they need." },
  { key: "Agreement", icon: FileSignature, text: "Agents draft scope, price and milestones. You approve." },
  { key: "Delivery", icon: Layers, text: "Evidence is attached to each deliverable." },
  { key: "Approval", icon: BadgeCheck, text: "Sensitive steps wait for a human decision." },
  { key: "Payment", icon: CircleDollarSign, text: "PayPal invoices are issued, and payments are confirmed by PayPal." },
] as const;

function SectionHeading({ eyebrow, title, intro, center }: { eyebrow: string; title: string; intro?: string; center?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{title}</h2>
      {intro && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{intro}</p>}
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_70%_-10%,rgb(118_86_232/0.18),transparent),radial-gradient(40rem_24rem_at_0%_20%,rgb(185_165_255/0.18),transparent)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
        <div className="animate-rise">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            <Sparkles className="h-3.5 w-3.5" /> AI agents + PayPal, working on your commitments
          </span>
          <h1 className="mt-5 text-[2.6rem] font-semibold leading-[1.05] sm:text-6xl">
            Your business promises.{" "}
            <span className="bg-gradient-to-r from-violet to-[#a07cff] bg-clip-text text-transparent">Handled.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            From the first client request to the final payment, PactPop&apos;s AI agents help you manage agreements, track deliverables, coordinate
            approvals, and get paid with confidence.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="lg">
              Get Started <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/how-it-works" size="lg" variant="outline">
              See How It Works
            </ButtonLink>
          </div>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {["Free plan, no card required", "Payments through PayPal", "You approve every financial step"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-success" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <HeroPreview />
      </div>
      <FlowStrip />
    </section>
  );
}

/** Static illustration of the product UI (marketing only — not live data). */
function HeroPreview() {
  const steps = [
    ["Request analyzed", "Intake Agent", "done"],
    ["Proposal approved", "You", "done"],
    ["Deposit invoice · $750.00", "Payment Agent", "done"],
    ["3 extra pages detected", "ScopeWatch", "flag"],
    ["Change order · $300.00", "Waiting for you", "wait"],
  ] as const;
  return (
    <div className="relative animate-rise [animation-delay:120ms]" aria-label="Illustration of a PactPop commitment">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-violet/25 via-lavender/20 to-transparent blur-2xl" />
      <div className="rounded-3xl border border-border bg-surface p-5 shadow-[var(--shadow-lift)] sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted">Commitment · Northwind Bakery</p>
            <p className="mt-1 font-display text-lg font-semibold">Website redesign</p>
          </div>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">In progress</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            ["Agreed", "$1,500"],
            ["Paid", "$750"],
            ["Pending", "$300"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-2 px-2 py-3">
              <p className="text-[0.7rem] uppercase tracking-wide text-muted">{l}</p>
              <p className="money mt-0.5 font-semibold">{v}</p>
            </div>
          ))}
        </div>
        <ol className="mt-5 space-y-3">
          {steps.map(([t, who, s]) => (
            <li key={t} className="flex items-center gap-3">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs",
                  s === "done" && "bg-success-soft text-success",
                  s === "flag" && "bg-warning-soft text-warning",
                  s === "wait" && "bg-accent-soft text-accent ring-2 ring-accent/30",
                )}
              >
                {s === "done" ? "✓" : s === "flag" ? "!" : "…"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t}</p>
                <p className="text-xs text-muted">{who}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function FlowStrip() {
  return (
    <div className="border-y border-border bg-surface/60">
      <ol className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-5">
        {FLOW.map(({ key, icon: Icon }, i) => (
          <li key={key} className="flex items-center gap-3 py-5 md:justify-center">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span className="font-display text-sm font-semibold tracking-wide">{key.toUpperCase()}</span>
            {i < FLOW.length - 1 && <ArrowRight className="ml-auto hidden h-4 w-4 text-muted md:block" aria-hidden />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Problem() {
  const pains = [
    ["Agreements live in email threads", "When a client asks for more, nobody can quickly answer what was actually agreed."],
    ["Scope creeps quietly", "Small extras add up to unpaid hours because there is no moment to pause and price them."],
    ["Payment chasing is manual", "Invoices, reminders and reconciliation happen in a different tool than the work itself."],
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="The problem"
        title="Freelancers don't lose money on the work. They lose it between the steps."
        intro="Requests, proposals, delivery and payment are usually disconnected. PactPop keeps them on one traceable record."
      />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {pains.map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-border bg-surface p-6">
            <p className="font-display font-semibold">{t}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how" className="bg-aubergine py-20 text-lilac">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-lavender">How PactPop works</p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">One record from request to payment.</h2>
          <p className="mt-4 text-lg text-lilac/75">Every step links back to what was promised, so you can always see what changed and why.</p>
        </div>
        <ol className="mt-12 grid gap-4 md:grid-cols-5">
          {FLOW.map(({ key, icon: Icon, text }, i) => (
            <li key={key} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <span className="money text-xs text-lavender">0{i + 1}</span>
              <Icon className="mt-3 h-6 w-6 text-lavender" />
              <p className="mt-3 font-display font-semibold text-white">{key}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-lilac/70">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export const AGENTS = [
  { name: "Intake Agent", icon: Inbox, text: "Turns a client's message into requirements, budget, timeline and the questions you still need to ask." },
  { name: "Scope Agent", icon: Radar, text: "Structures the work and compares new requests against the accepted scope." },
  { name: "Pricing Agent", icon: CircleDollarSign, text: "Estimates units of work. Your configured rates, not the model, compute the price." },
  { name: "Proposal Agent", icon: ScrollText, text: "Drafts a clear proposal with deliverables, milestones and payment terms." },
  { name: "Payment Agent", icon: ReceiptText, text: "Prepares PayPal invoices and checkout orders, then waits for your approval." },
  { name: "Finance Agent", icon: CircleDollarSign, text: "Reconciles payments, flags overdue invoices and summarises your cash position." },
  { name: "Operations Agent", icon: Workflow, text: "Tracks milestones and deliverables and drafts reminders before deadlines slip." },
];

export function AgentsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        eyebrow="AI agents"
        title="Seven specialists. One coordinated team."
        intro="An orchestrator routes each task to the right agent. Every tool call is permission-checked and logged, so you can see what the AI did and why."
      />
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AGENTS.map(({ name, icon: Icon, text }) => (
          <div key={name} className="group rounded-2xl border border-border bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent transition-transform group-hover:scale-105">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display font-semibold">{name}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-dashed border-accent/40 bg-accent-soft/50 p-5">
          <Bot className="h-6 w-6 text-accent" />
          <p className="mt-4 font-display font-semibold">Command Center</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Ask in plain language, for example &ldquo;Which invoices are overdue?&rdquo; PactPop answers, prepares the action, or asks for your approval.
          </p>
        </div>
      </div>
    </section>
  );
}

export function IntelligenceSection() {
  const items = [
    {
      icon: GitBranch,
      name: "VowGraph",
      title: "Commitment intelligence",
      text: "See how a request became a proposal, an agreement, deliverables, approvals and payments, all built from linked records.",
    },
    {
      icon: Radar,
      name: "ScopeWatch",
      title: "Scope-change detection",
      text: "New asks are compared with the accepted agreement. Additions are explained, priced by your rules and turned into a change order you approve.",
    },
    {
      icon: FileSearch,
      name: "ProofFlow",
      title: "Proof-to-payment",
      text: "Attach files, links and notes to deliverables. The AI checks them against acceptance criteria as advice, and you make the call.",
    },
  ];
  return (
    <section className="border-y border-border bg-surface-2/60 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Signature features" title="Built around the promise, not just the invoice." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map(({ icon: Icon, name, title, text }) => (
            <div key={name} className="rounded-3xl border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-aubergine text-lavender">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-display font-semibold">{name}</p>
                  <p className="text-xs text-muted">{title}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PayPalSection() {
  const points = [
    "Invoices for deposits, milestones and approved change orders are created through the PayPal Invoicing API",
    "Checkout orders through the PayPal Orders API, captured only after approval",
    "Payments are confirmed only by verified PayPal webhooks or server-side status checks, never by a browser redirect",
    "Duplicate webhook deliveries are ignored, and every payment event is stored with its PayPal ID",
  ];
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
      <SectionHeading
        eyebrow="PayPal integration"
        title="Payments are part of the agreement, not an afterthought."
        intro="The Payment Agent works through PayPal's official REST APIs. Amounts come from approved milestones in your records, never from AI-generated text."
      />
      <ul className="space-y-3">
        {points.map((p) => (
          <li key={p} className="flex gap-3 rounded-2xl border border-border bg-surface p-4">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <span className="text-sm leading-relaxed">{p}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SecuritySection() {
  const items = [
    { icon: ShieldCheck, t: "TrustGate permissions", d: "Each agent tool has a policy: allowed, needs approval, or blocked. The server enforces it. The AI cannot override it." },
    { icon: KeyRound, t: "Secrets stay server-side", d: "PayPal credentials and access tokens never reach the browser." },
    { icon: ScrollText, t: "Audit trail", d: "Sensitive actions record who or what acted, when, and what changed." },
    { icon: LockKeyhole, t: "Tenant isolation", d: "Every query is scoped to your business account." },
  ];
  return (
    <section className="bg-aubergine py-20 text-lilac">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-lavender">Security & financial controls</p>
        <h2 className="mt-3 max-w-2xl text-3xl font-semibold text-white sm:text-4xl">AI that prepares. People who decide.</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <Icon className="h-6 w-6 text-lavender" />
              <p className="mt-3 font-display font-semibold text-white">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-lilac/70">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-lilac/50">PactPop helps organise evidence and approvals. It does not provide legal advice or guarantee payment outcomes.</p>
      </div>
    </section>
  );
}

export function PricingSection({ showMatrix = false }: { showMatrix?: boolean }) {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        center
        eyebrow="Pricing"
        title="Costs less than one unbilled hour a month."
        intro="Start free on your next project. Upgrade when PactPop is catching more than it costs."
      />
      <div className="mt-10">
        <PricingPlans showMatrix={showMatrix} />
      </div>
    </section>
  );
}

const AUDIENCES = [
  {
    icon: UserRound,
    who: "Freelancers",
    pain: "You say yes to a small extra, then another, and the project quietly doubles.",
    gain: "ScopeWatch catches every extra ask and turns it into a priced change order in one click.",
  },
  {
    icon: Briefcase,
    who: "Consultants",
    pain: "Retainers and milestones drift, and invoicing is the last thing you get to.",
    gain: "Milestones carry their payment terms, and the Payment Agent prepares invoices as work is approved.",
  },
  {
    icon: Building2,
    who: "Small agencies",
    pain: "Nobody on the team knows exactly what the client agreed to or what's been paid.",
    gain: "One shared record per client, with role-based approvals and a full evidence trail.",
  },
];

export function AudienceSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading eyebrow="Who it's for" title="Built for people who sell their time and expertise." />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {AUDIENCES.map(({ icon: Icon, who, pain, gain }) => (
          <div key={who} className="flex flex-col rounded-3xl border border-border bg-surface p-6">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold">{who}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              <span className="font-medium text-error">Today: </span>
              {pain}
            </p>
            <p className="mt-3 text-sm leading-relaxed">
              <span className="font-medium text-success">With PactPop: </span>
              {gain}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const COMPARE: { label: string; email: string | boolean; invoicing: string | boolean; pactpop: string | boolean }[] = [
  { label: "Knows what was agreed", email: "Buried in threads", invoicing: false, pactpop: "Versioned agreement" },
  { label: "Catches scope creep", email: false, invoicing: false, pactpop: "ScopeWatch" },
  { label: "Prices extra work from your rates", email: false, invoicing: "Manual", pactpop: true },
  { label: "Links proof of delivery to payment", email: false, invoicing: false, pactpop: "ProofFlow" },
  { label: "Collects payment", email: false, invoicing: true, pactpop: "PayPal invoices & checkout" },
  { label: "Confirms payment automatically", email: false, invoicing: "Varies", pactpop: "Verified PayPal webhooks" },
  { label: "AI does the busywork, you approve", email: false, invoicing: false, pactpop: true },
];

function CompareCell({ v, strong }: { v: string | boolean; strong?: boolean }) {
  if (v === true) return <BadgeCheck className={cn("mx-auto h-5 w-5", strong ? "text-accent" : "text-success")} aria-label="Yes" />;
  if (v === false) return <span className="text-muted/60" aria-label="No">—</span>;
  return <span className={cn("text-sm", strong ? "font-medium" : "text-muted")}>{v}</span>;
}

export function ComparisonSection() {
  return (
    <section className="border-y border-border bg-surface-2/60 py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading center eyebrow="Why switch" title="Invoicing tools bill for the work. PactPop protects it." />
        <div className="mt-10 overflow-x-auto rounded-3xl border border-border bg-surface shadow-[var(--shadow-card)]">
          <table className="w-full min-w-[640px] text-center text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-5 py-4 text-left font-medium text-muted"> </th>
                <th className="px-5 py-4 font-medium text-muted">Email & spreadsheets</th>
                <th className="px-5 py-4 font-medium text-muted">Invoicing apps</th>
                <th className="bg-accent-soft/60 px-5 py-4">
                  <span className="font-display font-semibold text-accent">PactPop</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="px-5 py-3.5 text-left font-medium">{r.label}</td>
                  <td className="px-5 py-3.5">
                    <CompareCell v={r.email} />
                  </td>
                  <td className="px-5 py-3.5">
                    <CompareCell v={r.invoicing} />
                  </td>
                  <td className="bg-accent-soft/40 px-5 py-3.5">
                    <CompareCell v={r.pactpop} strong />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

const FAQ = [
  ["Does PactPop move real money?", "Not in this version. PactPop runs on the PayPal Sandbox, so every invoice and payment uses test accounts."],
  ["Can the AI send invoices or take payments on its own?", "Only if you allow it. Each agent tool has a TrustGate policy. Capturing payments, refunds and changes to agreed amounts always need an owner's approval."],
  ["Where do prices come from?", "Your pricing rules. Agents estimate units of work (pages, features, hours), and PactPop's pricing engine calculates the amount, with a breakdown you can review."],
  ["What happens when a client asks for more?", "ScopeWatch compares the request with the accepted agreement, explains what's new, and drafts a change order. Nothing is charged until you and the client approve it."],
  ["Is the AI's deliverable check final?", "No. ProofFlow's verification is advisory. You or your client make the completion decision."],
  ["Is there a free plan?", "Yes. Starter is free forever for up to 3 active commitments. Pro and Studio include a 14-day trial, and annual billing gives you 2 months free."],
  ["Can I cancel or change plans?", "Yes. You can upgrade, downgrade or cancel at any time. Your commitments, evidence and payment history stay with your account."],
  ["Does PactPop take a cut of my payments?", "No. Clients pay you directly through PayPal, and PayPal's standard fees apply. PactPop charges only its subscription."],
  ["Which AI model does it use?","Anthropic's Claude by default, behind a provider interface so the model can be swapped. Without an API key, a clearly labelled rule-based mode keeps the workflow usable."],
];

export function FaqSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <SectionHeading center eyebrow="FAQ" title="Questions, answered." />
      <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-surface">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
              {q}
              <span className="text-accent transition-transform group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet to-[#4b2fb8] px-6 py-14 text-center text-white sm:px-12">
        <h2 className="text-3xl font-semibold sm:text-4xl">Make promises. Make progress. Get paid.</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Run your next client project on PactPop for free. If it catches one unbilled extra, it has paid for a year of Pro.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/register" size="lg" className="bg-white text-violet-strong shadow-none hover:bg-lilac">
            Get Started free <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="ghost" className="text-white hover:bg-white/10">
            Try the demo account
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
