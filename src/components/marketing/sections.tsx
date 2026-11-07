import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Briefcase,
  Building2,
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
  UserRound,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ProductMockup } from "./product-mockup";
import { PricingPlans } from "./pricing";

export const FLOW = [
  { key: "Request", icon: Inbox, text: "A client describes what they need.", color: "bg-[#30b0c7]" },
  { key: "Agreement", icon: FileSignature, text: "Agents draft scope, price and milestones. You approve.", color: "bg-[#7656e8]" },
  { key: "Delivery", icon: Layers, text: "Evidence is attached to each deliverable.", color: "bg-[#ff9f0a]" },
  { key: "Approval", icon: BadgeCheck, text: "Sensitive steps wait for a human decision.", color: "bg-[#ff6b6b]" },
  { key: "Payment", icon: CircleDollarSign, text: "PayPal collects payment, and the payment is confirmed by PayPal.", color: "bg-[#34c759]" },
] as const;

/* ───────── building blocks ───────── */

function Section({ children, className, tone = "plain", id }: { children: ReactNode; className?: string; tone?: "plain" | "grouped" | "dark"; id?: string }) {
  return (
    <section
      id={id}
      className={cn(
        "py-20 sm:py-28",
        tone === "grouped" && "border-y border-border bg-black/[0.015] dark:bg-white/[0.015]",
        tone === "dark" && "border-y border-white/5 bg-[#08080d] text-white",
        className,
      )}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-6">{children}</div>
    </section>
  );
}

function Heading({ eyebrow, title, intro, dark, left }: { eyebrow?: string; title: ReactNode; intro?: string; dark?: boolean; left?: boolean }) {
  return (
    <div className={cn("max-w-3xl", !left && "mx-auto text-center")}>
      {eyebrow && <p className={cn("text-[0.9375rem] font-semibold", dark ? "text-lavender" : "text-accent")}>{eyebrow}</p>}
      <h2 className="mt-2 text-[2.25rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-[3rem]">{title}</h2>
      {intro && <p className={cn("mt-4 text-[1.125rem] leading-relaxed sm:text-[1.25rem]", dark ? "text-white/65" : "text-muted")}>{intro}</p>}
    </div>
  );
}

function IconTile({ icon: Icon, color = "bg-accent", size = "md" }: { icon: LucideIcon; color?: string; size?: "md" | "lg" }) {
  return (
    <span className={cn("grid shrink-0 place-items-center text-white", color, size === "lg" ? "h-12 w-12 rounded-[0.8rem]" : "h-10 w-10 rounded-[0.65rem]")}>
      <Icon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
    </span>
  );
}

function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass rounded-[1.75rem] border border-border p-7 shadow-[var(--shadow-card)] dark:shadow-none sm:p-8", className)}>{children}</div>;
}

/* ───────── sections ───────── */

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[48rem] bg-[radial-gradient(56rem_30rem_at_50%_-8rem,rgb(108_92_255/0.35),transparent)]" />
      <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-14 text-center sm:px-6 sm:pt-20">
        <span className="animate-rise inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3.5 py-1.5 text-[0.8125rem] font-semibold text-accent">
          <Sparkles className="h-3.5 w-3.5" /> AI agents + PayPal, working on your commitments
        </span>
        <h1 className="animate-rise mx-auto mt-6 max-w-4xl text-[2.9rem] font-bold leading-[1.02] tracking-[-0.045em] [animation-delay:60ms] sm:text-[4.75rem]">
          Your business promises.{" "}
          <span className="bg-gradient-to-r from-[#6c8cff] via-[#8b7bff] to-[#ff9dbd] bg-clip-text text-transparent">Handled.</span>
        </h1>
        <p className="animate-rise mx-auto mt-6 max-w-2xl text-[1.1875rem] leading-relaxed text-muted [animation-delay:120ms] sm:text-[1.3125rem]">
          From the first client request to the final payment, PactPop&apos;s AI agents help you manage agreements, track deliverables, coordinate approvals, and get paid with
          confidence.
        </p>
        <div className="animate-rise mt-9 flex flex-wrap justify-center gap-3 [animation-delay:180ms]">
          <ButtonLink href="/register" size="lg" className="rounded-full px-7">
            Get Started <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/how-it-works" size="lg" variant="outline" className="rounded-full px-7">
            See How It Works
          </ButtonLink>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[0.875rem] text-muted">
          {["Free plan, no card required", "Payments through PayPal", "You approve every financial step"].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-success" /> {t}
            </li>
          ))}
        </ul>
        <div className="animate-rise mt-16 px-2 [animation-delay:260ms]">
          <ProductMockup />
        </div>
      </div>
      <FlowStrip />
    </section>
  );
}

export function FlowStrip() {
  return (
    <div className="relative border-y border-border bg-black/[0.015] dark:bg-white/[0.015]">
      <ol className="mx-auto flex max-w-6xl snap-x gap-2 overflow-x-auto px-5 py-6 sm:justify-between sm:px-6 [scrollbar-width:none]">
        {FLOW.map(({ key, icon, color }, i) => (
          <li key={key} className="flex shrink-0 snap-start items-center gap-2.5">
            <IconTile icon={icon} color={color} />
            <span className="text-[0.9375rem] font-semibold">{key}</span>
            {i < FLOW.length - 1 && <ArrowRight className="mx-2 hidden h-4 w-4 text-faint sm:block" aria-hidden />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Problem() {
  const pains = [
    { icon: Inbox, color: "bg-[#30b0c7]", t: "Agreements live in email threads", d: "When a client asks for more, nobody can quickly answer what was actually agreed." },
    { icon: Radar, color: "bg-[#ff9f0a]", t: "Scope creeps quietly", d: "Small extras add up to unpaid hours because there's no moment to pause and price them." },
    { icon: ReceiptText, color: "bg-[#ff6b6b]", t: "Payment chasing is manual", d: "Invoices, reminders and reconciliation happen in a different tool than the work itself." },
  ];
  return (
    <Section tone="grouped">
      <Heading
        eyebrow="The problem"
        title="Freelancers don't lose money on the work. They lose it between the steps."
        intro="Requests, proposals, delivery and payment are usually disconnected. PactPop keeps them on one traceable record."
      />
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {pains.map(({ icon, color, t, d }) => (
          <Tile key={t}>
            <IconTile icon={icon} color={color} size="lg" />
            <p className="mt-5 text-[1.25rem] font-semibold tracking-tight">{t}</p>
            <p className="mt-2 leading-relaxed text-muted">{d}</p>
          </Tile>
        ))}
      </div>
    </Section>
  );
}

export function HowItWorks() {
  return (
    <Section tone="dark">
      <Heading dark eyebrow="How PactPop works" title="One record from request to payment." intro="Every step links back to what was promised, so you can always see what changed and why." />
      <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {FLOW.map(({ key, icon, text, color }, i) => (
          <li key={key} className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.035] p-6">
            <div className="flex items-center justify-between">
              <IconTile icon={icon} color={color} />
              <span className="money text-sm text-white/40">0{i + 1}</span>
            </div>
            <p className="mt-5 text-[1.125rem] font-semibold">{key}</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-white/60">{text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export const AGENTS: { name: string; icon: LucideIcon; color: string; text: string }[] = [
  { name: "Intake", icon: Inbox, color: "bg-[#30b0c7]", text: "Turns a client's message into requirements, budget, timeline and the questions you still need to ask." },
  { name: "Scope", icon: Radar, color: "bg-[#ff9f0a]", text: "Structures the work and compares new requests against the accepted scope." },
  { name: "Pricing", icon: CircleDollarSign, color: "bg-[#34c759]", text: "Estimates units of work. Your configured rates, not the model, compute the price." },
  { name: "Proposal", icon: ScrollText, color: "bg-[#7656e8]", text: "Drafts a clear proposal with deliverables, milestones and payment terms." },
  { name: "Payment", icon: ReceiptText, color: "bg-[#0a84ff]", text: "Prepares PayPal invoices and checkout orders, then waits for your approval." },
  { name: "Finance", icon: CircleDollarSign, color: "bg-[#5856d6]", text: "Reconciles payments, flags overdue invoices and summarises your cash position." },
  { name: "Operations", icon: Workflow, color: "bg-[#ff6b6b]", text: "Tracks milestones and deliverables and drafts reminders before deadlines slip." },
];

export function AgentsSection() {
  return (
    <Section tone="plain">
      <Heading
        eyebrow="AI agents"
        title="Seven specialists. One coordinated team."
        intro="An orchestrator routes each task to the right agent. Every tool call is permission-checked and logged, so you can see what the AI did and why."
      />
      <ul className="mx-auto mt-14 grid max-w-5xl gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map(({ name, icon, color, text }) => (
          <li key={name} className="flex gap-4">
            <IconTile icon={icon} color={color} size="lg" />
            <div>
              <p className="text-[1.0625rem] font-semibold">{name} Agent</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">{text}</p>
            </div>
          </li>
        ))}
        <li className="flex gap-4">
          <IconTile icon={Bot} color="bg-gradient-to-br from-[#8f72f6] to-[#5b3cd4]" size="lg" />
          <div>
            <p className="text-[1.0625rem] font-semibold">Command Center</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted">
              Ask in plain language: &ldquo;Which invoices are overdue?&rdquo; PactPop answers, prepares the action, or asks for your approval.
            </p>
          </div>
        </li>
      </ul>
    </Section>
  );
}

/** Bento grid of the signature features. */
export function IntelligenceSection() {
  return (
    <Section tone="grouped">
      <Heading eyebrow="Signature features" title="Built around the promise, not just the invoice." />
      <div className="mt-14 grid gap-4 lg:grid-cols-3">
        <Tile className="lg:col-span-2">
          <IconTile icon={Radar} color="bg-[#ff9f0a]" size="lg" />
          <p className="mt-5 text-[0.9375rem] font-semibold text-[#d98a12]">ScopeWatch</p>
          <p className="mt-1 text-[1.75rem] font-bold leading-tight tracking-tight">Extra asks get caught, not absorbed.</p>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">
            New requests are compared with the accepted agreement. Additions are explained, priced by your rules, and turned into a change order you approve. Nothing is charged
            silently.
          </p>
          <div className="mt-6 max-w-md overflow-hidden rounded-2xl border border-border bg-fill">
            {[
              ["Agreed scope", "5 pages"],
              ["New request", "+ Team, Gallery, FAQ"],
              ["Change order", "3 × $100 = $300.00"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border px-4 py-3 text-[0.9375rem] last:border-0">
                <span className="text-muted">{k}</span>
                <span className="money font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </Tile>
        <Tile>
          <IconTile icon={GitBranch} color="bg-[#7656e8]" size="lg" />
          <p className="mt-5 text-[0.9375rem] font-semibold text-accent">VowGraph</p>
          <p className="mt-1 text-[1.5rem] font-bold leading-tight tracking-tight">See how every promise connects.</p>
          <p className="mt-3 leading-relaxed text-muted">Request → proposal → agreement → deliverables → approvals → payments, built from linked records.</p>
        </Tile>
        <Tile>
          <IconTile icon={FileSearch} color="bg-[#34c759]" size="lg" />
          <p className="mt-5 text-[0.9375rem] font-semibold text-success">ProofFlow</p>
          <p className="mt-1 text-[1.5rem] font-bold leading-tight tracking-tight">Proof checked against the promise.</p>
          <p className="mt-3 leading-relaxed text-muted">Attach files, links and notes. The AI checks them against the acceptance criteria. Its verdict is advice; the decision is yours.</p>
        </Tile>
        <Tile className="lg:col-span-2 !border-transparent bg-gradient-to-br from-[#7b6dff] via-[#5b45e8] to-[#3a1fb8] !text-white">
          <IconTile icon={ShieldCheck} color="bg-white/20" size="lg" />
          <p className="mt-5 text-[0.9375rem] font-semibold text-white/75">TrustGate</p>
          <p className="mt-1 text-[1.75rem] font-bold leading-tight tracking-tight">AI prepares. You decide.</p>
          <p className="mt-3 max-w-xl leading-relaxed text-white/75">
            Every agent tool has a policy: allowed, needs approval, or blocked. Capturing payments, refunds and changes to agreed amounts always wait for you, and the server enforces
            it.
          </p>
        </Tile>
      </div>
    </Section>
  );
}

export function PayPalSection() {
  const points = [
    "Invoices for deposits, milestones and approved change orders are created through the PayPal Invoicing API",
    "Checkout orders through the PayPal Orders API, captured only after approval",
    "Payments are confirmed only by verified PayPal webhooks or server-side checks, never a browser redirect",
    "Duplicate webhook deliveries are ignored, and every payment event is stored with its PayPal ID",
  ];
  return (
    <Section tone="plain">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Heading
          left
          eyebrow="PayPal integration"
          title="Payments are part of the agreement."
          intro="The Payment Agent works through PayPal's official REST APIs. Amounts come from approved milestones in your records, never from AI-generated text."
        />
        <ul className="glass divide-y divide-border overflow-hidden rounded-[1.5rem] border border-border">
          {points.map((p) => (
            <li key={p} className="flex gap-3 px-5 py-4">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              <span className="text-[0.9375rem] leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

export function SecuritySection() {
  const items = [
    { icon: ShieldCheck, color: "bg-[#7656e8]", t: "TrustGate permissions", d: "Each agent tool is allowed, needs approval, or is blocked. The server enforces it, and the AI cannot override it." },
    { icon: KeyRound, color: "bg-[#ff9f0a]", t: "Secrets stay server-side", d: "PayPal credentials and access tokens never reach the browser." },
    { icon: ScrollText, color: "bg-[#30b0c7]", t: "Audit trail", d: "Sensitive actions record who or what acted, when, and what changed." },
    { icon: LockKeyhole, color: "bg-[#34c759]", t: "Tenant isolation", d: "Every query is scoped to your business account." },
  ];
  return (
    <Section tone="dark">
      <Heading dark eyebrow="Security & financial controls" title="AI that prepares. People who decide." />
      <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon, color, t, d }) => (
          <div key={t} className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.035] p-6">
            <IconTile icon={icon} color={color} />
            <p className="mt-5 text-[1.0625rem] font-semibold">{t}</p>
            <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-white/60">{d}</p>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[0.8125rem] text-white/40">PactPop helps organise evidence and approvals. It does not provide legal advice or guarantee payment outcomes.</p>
    </Section>
  );
}

export function PricingSection({ showMatrix = false }: { showMatrix?: boolean }) {
  return (
    <Section tone="grouped" id="pricing">
      <Heading eyebrow="Pricing" title="Costs less than one unbilled hour a month." intro="Start free on your next project. Upgrade when PactPop is catching more than it costs." />
      <div className="mt-12">
        <PricingPlans showMatrix={showMatrix} />
      </div>
    </Section>
  );
}

const AUDIENCES = [
  {
    icon: UserRound,
    color: "bg-[#7656e8]",
    who: "Freelancers",
    pain: "You say yes to a small extra, then another, and the project quietly doubles.",
    gain: "ScopeWatch catches every extra ask and turns it into a priced change order.",
  },
  {
    icon: Briefcase,
    color: "bg-[#30b0c7]",
    who: "Consultants",
    pain: "Retainers and milestones drift, and invoicing is the last thing you get to.",
    gain: "Milestones carry their payment terms, and invoices are prepared as work is approved.",
  },
  {
    icon: Building2,
    color: "bg-[#ff9f0a]",
    who: "Small agencies",
    pain: "Nobody on the team knows exactly what the client agreed to or what's been paid.",
    gain: "One shared record per client, with role-based approvals and a full evidence trail.",
  },
];

export function AudienceSection() {
  return (
    <Section tone="grouped">
      <Heading eyebrow="Who it's for" title="Built for people who sell their time and expertise." />
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {AUDIENCES.map(({ icon, color, who, pain, gain }) => (
          <Tile key={who} className="flex flex-col">
            <IconTile icon={icon} color={color} size="lg" />
            <p className="mt-5 text-[1.25rem] font-semibold tracking-tight">{who}</p>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">{pain}</p>
            <p className="mt-4 rounded-2xl border border-accent/20 bg-accent-soft px-4 py-3 text-[0.9375rem] leading-relaxed">
              <span className="font-semibold text-accent">With PactPop: </span>
              {gain}
            </p>
          </Tile>
        ))}
      </div>
    </Section>
  );
}

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
  if (v === true) return <BadgeCheck className={cn("mx-auto h-5 w-5", strong ? "text-accent" : "text-success")} aria-label="Yes" />;
  if (v === false)
    return (
      <span className="text-faint" aria-label="No">
        —
      </span>
    );
  return <span className={cn("text-[0.875rem]", strong ? "font-semibold text-accent" : "text-muted")}>{v}</span>;
}

export function ComparisonSection() {
  return (
    <Section tone="plain">
      <Heading eyebrow="Why switch" title="Invoicing tools bill for the work. PactPop protects it." />
      <div className="glass mx-auto mt-14 max-w-4xl overflow-x-auto rounded-[1.5rem] border border-border">
        <table className="w-full min-w-[600px] text-center">
          <thead>
            <tr className="border-b border-border text-[0.8125rem]">
              <th className="px-5 py-4 text-left font-medium text-muted">
                <span className="sr-only">Capability</span>
              </th>
              <th className="px-4 py-4 font-medium text-muted">Email & spreadsheets</th>
              <th className="px-4 py-4 font-medium text-muted">Invoicing apps</th>
              <th className="px-4 py-4">
                <span className="text-[0.9375rem] font-bold text-accent">PactPop</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {COMPARE.map((r) => (
              <tr key={r.label}>
                <td className="px-5 py-3.5 text-left text-[0.9375rem] font-medium">{r.label}</td>
                <td className="px-4 py-3.5">
                  <CompareCell v={r.email} />
                </td>
                <td className="px-4 py-3.5">
                  <CompareCell v={r.invoicing} />
                </td>
                <td className="px-4 py-3.5">
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
  ["Is there a free plan?", "Yes. Starter is free forever for up to 3 active commitments. Pro and Studio include a 14-day trial, and annual billing gives you 2 months free."],
  ["Can I cancel or change plans?", "Yes. You can upgrade, downgrade or cancel at any time. Your commitments, evidence and payment history stay with your account."],
  ["Does PactPop take a cut of my payments?", "No. Clients pay you directly through PayPal, and PayPal's standard fees apply. PactPop charges only its subscription."],
  [
    "Which AI model does it use?",
    "Anthropic's Claude by default, behind a provider interface so the model can be swapped. Without an API key, a clearly labelled rule-based mode keeps the workflow usable.",
  ],
];

export function FaqSection() {
  return (
    <Section tone="plain">
      <Heading eyebrow="FAQ" title="Questions, answered." />
      <div className="glass mx-auto mt-12 max-w-3xl divide-y divide-border overflow-hidden rounded-[1.5rem] border border-border">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-[1.0625rem] font-medium transition-colors hover:bg-fill/50">
              {q}
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fill text-accent transition-transform duration-300 group-open:rotate-45" aria-hidden>
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function CtaBand() {
  return (
    <section className="px-5 pb-20 sm:px-6 sm:pb-28">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.25rem] bg-gradient-to-br from-[#7b6dff] via-[#5b45e8] to-[#3a1fb8] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
        <h2 className="text-[2.25rem] font-bold leading-tight tracking-[-0.035em] sm:text-[3.25rem]">Make promises. Make progress. Get paid.</h2>
        <p className="mx-auto mt-4 max-w-xl text-[1.125rem] text-white/80">Run your next client project on PactPop for free. If it catches one unbilled extra, it has paid for a year of Pro.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/register" size="lg" variant="white" className="rounded-full px-7">
            Get Started free <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/login" size="lg" variant="ghost" className="rounded-full px-7 text-white hover:bg-white/15">
            Try the demo account
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
