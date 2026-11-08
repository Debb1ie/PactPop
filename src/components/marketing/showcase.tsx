import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Check,
  CircleDollarSign,
  FileCheck2,
  Inbox,
  Minus,
  Radar,
  ReceiptText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  Webhook,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Silk } from "./feature-visuals";

/* ───────── shared ───────── */

function Eyebrow({ children, tone = "text-[#6c4ef5]" }: { children: React.ReactNode; tone?: string }) {
  return <p className={cn("text-[0.8125rem] font-semibold uppercase tracking-[0.14em]", tone)}>{children}</p>;
}

function Title({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("mt-3 text-balance text-[2.25rem] font-medium leading-[1.06] tracking-[-0.04em] text-[#0d0d10] sm:text-[3rem]", className)}>{children}</h2>;
}

/** iOS-style app icon: gradient squircle with a white glyph. */
function AppIcon({ icon: Icon, tile, size = "md" }: { icon: LucideIcon; tile: string; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-b text-white shadow-[0_10px_20px_-10px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.35)]",
        size === "lg" ? "h-14 w-14 rounded-[1.05rem]" : "h-11 w-11 rounded-[0.85rem]",
        tile,
      )}
    >
      <Icon className={size === "lg" ? "h-7 w-7" : "h-5 w-5"} strokeWidth={2} />
    </span>
  );
}

/* ───────── agents: a colourful team grid ───────── */

type Authority = "Reads" | "Drafts" | "You approve";
const AGENT_TILES: { name: string; icon: LucideIcon; text: string; authority: Authority; tile: string; tint: string }[] = [
  { name: "Intake", icon: Inbox, text: "Turns a client's message into requirements, budget and open questions.", authority: "Drafts", tile: "from-[#5ac8fa] to-[#007aff]", tint: "bg-[#eaf4ff]" },
  { name: "Scope", icon: Radar, text: "Compares every new ask against the accepted agreement.", authority: "Drafts", tile: "from-[#b18cff] to-[#6c4ef5]", tint: "bg-[#f1ecff]" },
  { name: "Pricing", icon: CircleDollarSign, text: "Estimates units of work. Your rate card sets the price.", authority: "Drafts", tile: "from-[#5ee08a] to-[#24a148]", tint: "bg-[#e9f8ee]" },
  { name: "Proposal", icon: ScrollText, text: "Writes deliverables, milestones and payment terms.", authority: "You approve", tile: "from-[#ffb36b] to-[#ff7a1a]", tint: "bg-[#fff1e4]" },
  { name: "ProofFlow", icon: BadgeCheck, text: "Checks delivered work against the acceptance criteria.", authority: "Drafts", tile: "from-[#5be0d2] to-[#0f9182]", tint: "bg-[#e6f7f5]" },
  { name: "PayFlow", icon: ReceiptText, text: "Prepares PayPal invoices and tracks payment status.", authority: "You approve", tile: "from-[#4fa3ff] to-[#0a3d91]", tint: "bg-[#e8f0fb]" },
  { name: "Finance", icon: Wallet, text: "Reconciles payments and flags overdue invoices.", authority: "Reads", tile: "from-[#ff8ab3] to-[#e0457b]", tint: "bg-[#ffecf3]" },
  { name: "Operations", icon: Workflow, text: "Tracks milestones and drafts reminders before deadlines slip.", authority: "Drafts", tile: "from-[#ffd25e] to-[#f0a500]", tint: "bg-[#fff7df]" },
];
const AUTH_DOT: Record<Authority, string> = { Reads: "bg-[#9a9aa6]", Drafts: "bg-[#6c4ef5]", "You approve": "bg-[#f0a52b]" };

export function AgentsShowcase() {
  return (
    <section id="agents" className="scroll-mt-24 py-20 sm:py-28">
      <div className="pp-reveal mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <Eyebrow>AI agents</Eyebrow>
            <Title>Eight specialists, one coordinated team.</Title>
          </div>
          <p className="max-w-md text-[0.9375rem] leading-relaxed text-[#62626e] lg:pb-2">
            An orchestrator routes each task to the right agent. Every tool call is permission-checked and logged, so you can always see what the AI did and why.
          </p>
        </div>

        {/* orchestrator bar */}
        <div className="mt-10 flex items-center gap-3 rounded-full bg-[#0d0d10] py-2 pl-2 pr-5 text-white shadow-[0_20px_40px_-24px_rgb(0_0_0/0.7)]">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#b18cff] to-[#6c4ef5]">
            <Sparkles className="h-5 w-5" />
          </span>
          <p className="min-w-0 flex-1 text-[0.875rem] leading-snug sm:truncate sm:text-[0.9375rem]">
            <span className="font-semibold">Orchestrator</span>
            <span className="text-white/60"> · &ldquo;Which invoices are overdue?&rdquo; → Finance Agent</span>
          </p>
          <span className="hidden items-center gap-1.5 text-[0.75rem] text-white/60 sm:flex">
            <ShieldCheck className="h-4 w-4 text-[#5ee08a]" /> TrustGate checked
          </span>
        </div>

        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGENT_TILES.map((a) => (
            <li
              key={a.name}
              className={cn(
                "group relative flex flex-col rounded-[1.6rem] p-5 transition-transform duration-500 ease-[var(--ease-ios)] hover:-translate-y-1.5",
                a.tint,
              )}
            >
              <div className="flex items-start justify-between">
                <span className="transition-transform duration-500 ease-[var(--ease-ios)] group-hover:-rotate-6 group-hover:scale-110">
                  <AppIcon icon={a.icon} tile={a.tile} />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[0.6875rem] font-medium text-[#0d0d10]/75 shadow-[0_6px_14px_-8px_rgb(0_0_0/0.3)]">
                  <span className={cn("h-1.5 w-1.5 rounded-full", AUTH_DOT[a.authority])} aria-hidden /> {a.authority}
                </span>
              </div>
              <p className="mt-6 text-[1.125rem] font-semibold tracking-[-0.01em] text-[#0d0d10]">{a.name} Agent</p>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-[#0d0d10]/60">{a.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── PayPal: a payment receipt walking through each API ───────── */

const PAY_STEPS: { icon: LucideIcon; api: string; title: string; detail: string }[] = [
  { icon: ReceiptText, api: "Invoicing API", title: "Deposit invoice created", detail: "Amount taken from the approved milestone" },
  { icon: CircleDollarSign, api: "Orders API", title: "Client pays in the Sandbox", detail: "Captured only after your approval" },
  { icon: Webhook, api: "Webhooks", title: "Webhook signature verified", detail: "Not a browser redirect" },
  { icon: FileCheck2, api: "Idempotency", title: "Recorded once in the ledger", detail: "Stored with its PayPal ID" },
];

export function PayPalShowcase() {
  return (
    <section id="paypal" className="scroll-mt-24 py-20 sm:py-28">
      <div className="pp-reveal mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div>
          <Eyebrow tone="text-[#0a62d0]">PayPal integration</Eyebrow>
          <Title>Payments are part of the agreement.</Title>
          <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-[#62626e]">
            The PayFlow Agent works through PayPal&apos;s official REST APIs. Amounts come from approved milestones in your records, never from AI-generated text.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {["Invoicing v2", "Orders v2", "Verified webhooks", "Sandbox only"].map((t) => (
              <li key={t} className="rounded-full bg-white px-3.5 py-1.5 text-[0.8125rem] font-medium text-[#0d0d10] shadow-[0_8px_20px_-12px_rgb(0_0_0/0.35)]">
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* receipt stack */}
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-x-6 -top-4 h-full rotate-[-4deg] rounded-[2rem] bg-[#cfe3ff]" aria-hidden />
          <div className="absolute inset-x-3 -top-2 h-full rotate-[2.5deg] rounded-[2rem] bg-[#e4efff]" aria-hidden />
          <div className="relative overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_80px_-40px_rgb(10_60_160/0.55)]">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#0a3d91] via-[#0a62d0] to-[#38a3ff] px-6 pb-6 pt-5 text-white">
              <Silk color="#ffffff" />
              <div className="relative flex items-center justify-between text-[0.75rem] text-white/80">
                <span>Deposit · 50%</span>
                <span className="rounded-full bg-white/15 px-2.5 py-1 font-medium backdrop-blur">Sandbox</span>
              </div>
              <p className="relative mt-4 text-[0.8125rem] text-white/80">Northwind Bakery · Website redesign</p>
              <p className="money relative mt-1 text-[2.5rem] font-bold leading-none">$750.00</p>
            </div>
            <ol className="relative px-6 py-5">
              <span className="absolute bottom-9 left-[2.65rem] top-9 w-px bg-gradient-to-b from-[#0a62d0]/40 to-[#24a148]/50" aria-hidden />
              {PAY_STEPS.map((s, i) => {
                const last = i === PAY_STEPS.length - 1;
                return (
                  <li key={s.api} className="relative flex items-start gap-4 py-2.5">
                    <span className={cn("relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-[0_6px_14px_-6px_rgb(0_0_0/0.4)]", last ? "bg-[#24a148]" : "bg-[#0a62d0]")}>
                      <s.icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9375rem] font-semibold text-[#0d0d10]">{s.title}</p>
                      <p className="text-[0.8125rem] text-[#0d0d10]/55">
                        {s.api} · {s.detail}
                      </p>
                    </div>
                    <Check className={cn("mt-1 h-4 w-4", last ? "text-[#24a148]" : "text-[#0a62d0]/60")} />
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── audience: silk persona cards ───────── */

const PERSONAS: { icon: LucideIcon; who: string; pain: string; gain: string; silk: string }[] = [
  {
    icon: UserRound,
    who: "Freelancers",
    pain: "You say yes to a small extra, then another, and the project quietly doubles.",
    gain: "ScopeWatch catches every extra ask and prices it as a change order.",
    silk: "bg-[radial-gradient(80%_70%_at_20%_10%,#cdbdf2_0%,transparent_60%),radial-gradient(70%_60%_at_90%_90%,#8f6fe0_0%,transparent_60%),linear-gradient(160deg,#b9a6e8,#7d62c9)]",
  },
  {
    icon: Briefcase,
    who: "Consultants",
    pain: "Milestones drift, and invoicing is the last thing you get to.",
    gain: "Milestones carry their payment terms, and invoices are prepared as work is approved.",
    silk: "bg-[radial-gradient(80%_70%_at_30%_0%,#ffd9a8_0%,transparent_60%),radial-gradient(70%_70%_at_80%_100%,#e8650f_0%,transparent_60%),linear-gradient(170deg,#f7b267,#e07a1f)]",
  },
  {
    icon: Building2,
    who: "Small agencies",
    pain: "Nobody on the team knows exactly what the client agreed to.",
    gain: "One shared record per client, with approvals and a full evidence trail.",
    silk: "bg-[radial-gradient(80%_70%_at_20%_0%,#9fc48a_0%,transparent_60%),radial-gradient(70%_70%_at_90%_100%,#2e5b26_0%,transparent_60%),linear-gradient(165deg,#6f9a5c,#3b6a32)]",
  },
];

export function AudienceShowcase() {
  return (
    <section className="py-20 sm:py-28">
      <div className="pp-reveal mx-auto max-w-6xl px-5 sm:px-6">
        <Eyebrow tone="text-[#e07a1f]">Who it&apos;s for</Eyebrow>
        <Title className="max-w-3xl">Built for people who sell their time and expertise.</Title>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {PERSONAS.map((p) => (
            <article key={p.who} className="group overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_60px_-40px_rgb(0_0_0/0.45)] transition-transform duration-500 ease-[var(--ease-ios)] hover:-translate-y-1.5">
              <div className={cn("relative h-40 overflow-hidden p-5 text-white", p.silk)}>
                <Silk color="#ffffff" />
                <div className="relative flex h-full flex-col justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-[0.9rem] bg-white/90 text-[#0d0d10] shadow-[0_10px_20px_-10px_rgb(0_0_0/0.5)] transition-transform duration-500 ease-[var(--ease-ios)] group-hover:-rotate-6">
                    <p.icon className="h-6 w-6" />
                  </span>
                  <p className="text-[1.5rem] font-semibold tracking-[-0.02em]">{p.who}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#0d0d10]/40">Before</p>
                <p className="mt-1 text-[0.9375rem] leading-relaxed text-[#0d0d10]/55">{p.pain}</p>
                <div className="my-4 flex items-center gap-2 text-[#0d0d10]/30" aria-hidden>
                  <span className="h-px flex-1 bg-current" />
                  <ArrowRight className="h-4 w-4 rotate-90" />
                  <span className="h-px flex-1 bg-current" />
                </div>
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[#0d0d10]">With PactPop</p>
                <p className="mt-1 text-[0.9375rem] font-medium leading-relaxed text-[#0d0d10]">{p.gain}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── comparison: three tier-style cards ───────── */

const CAPABILITIES = [
  "Knows what was agreed",
  "Catches scope creep",
  "Prices extra work from your rates",
  "Links proof of delivery to payment",
  "Collects payment",
  "Confirms payment automatically",
  "AI does the busywork, you approve",
];
const OPTIONS: { name: string; note: string; has: (string | boolean)[]; hero?: boolean }[] = [
  { name: "Email & spreadsheets", note: "What most people use today", has: ["Buried in threads", false, false, false, false, false, false] },
  { name: "Invoicing apps", note: "Bills for the work", has: [false, false, "Manual", false, true, "Varies", false] },
  { name: "PactPop", note: "Protects the work, then bills it", has: ["Versioned", "ScopeWatch", true, "ProofFlow", "PayPal", "Verified webhooks", true], hero: true },
];

export function ComparisonShowcase() {
  return (
    <section className="py-20 sm:py-28">
      <div className="pp-reveal mx-auto max-w-6xl px-5 sm:px-6">
        <div className="text-center">
          <Eyebrow>Why switch</Eyebrow>
          <Title className="mx-auto max-w-3xl">Invoicing tools bill for the work. PactPop protects it.</Title>
        </div>
        <div className="mt-14 grid items-center gap-4 lg:grid-cols-[1fr_1fr_1.15fr]">
          {OPTIONS.map((o) => (
            <div
              key={o.name}
              className={cn(
                "relative overflow-hidden rounded-[1.75rem] p-6",
                o.hero
                  ? "order-first bg-gradient-to-b from-[#7c5cff] to-[#4b2fd1] py-8 text-white shadow-[0_40px_80px_-30px_rgb(76_47_209/0.7)] lg:order-none lg:scale-[1.04]"
                  : "bg-white text-[#0d0d10] shadow-[0_24px_50px_-36px_rgb(0_0_0/0.45)]",
              )}
            >
              {o.hero && <Silk color="#ffffff" />}
              <div className="relative">
                <p className="text-[1.25rem] font-semibold tracking-[-0.02em]">{o.name}</p>
                <p className={cn("mt-0.5 text-[0.8125rem]", o.hero ? "text-white/70" : "text-[#0d0d10]/50")}>{o.note}</p>
                <ul className="mt-6 space-y-3">
                  {CAPABILITIES.map((c, i) => {
                    const v = o.has[i];
                    const yes = v !== false;
                    return (
                      <li key={c} className="flex items-start gap-3 text-[0.875rem]">
                        <span
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                            o.hero ? "bg-white text-[#4b2fd1]" : yes ? "bg-[#0d0d10]/10 text-[#0d0d10]/70" : "bg-[#0d0d10]/[0.04] text-[#0d0d10]/25",
                          )}
                        >
                          {yes ? <Check className="h-3 w-3" strokeWidth={3} /> : <Minus className="h-3 w-3" strokeWidth={3} />}
                        </span>
                        <span className={cn("min-w-0", !yes && !o.hero && "text-[#0d0d10]/35 line-through decoration-[#0d0d10]/20")}>
                          {c}
                          {typeof v === "string" && <span className={cn("ml-1.5 text-[0.75rem]", o.hero ? "font-semibold text-[#d7ee6e]" : "text-[#0d0d10]/45")}>· {v}</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {o.hero && (
                  <Link href="/login" className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[0.875rem] font-semibold text-[#4b2fd1] transition hover:bg-[#f1ecff]">
                    Try it free <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
