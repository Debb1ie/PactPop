/**
 * PactPop subscription plans — single source of truth for marketing pages, in-app limits and
 * (later) PayPal Subscriptions billing. Prices are integer minor units (USD cents).
 *
 * Pricing rationale lives in docs/BUSINESS_MODEL.md.
 */
export type PlanId = "solo" | "pro" | "studio";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyMinor: number;
  /** Effective monthly price when billed annually */
  annualMonthlyMinor: number;
  includedSeats: number;
  extraSeatMinor: number | null;
  limits: { activeCommitments: number | null; aiActionsPerMonth: number; clients: number | null };
  highlights: string[];
  cta: string;
  featured?: boolean;
};

export const PLANS: Plan[] = [
  {
    id: "solo",
    name: "Starter",
    tagline: "Try PactPop on your next client project.",
    monthlyMinor: 0,
    annualMonthlyMinor: 0,
    includedSeats: 1,
    extraSeatMinor: null,
    limits: { activeCommitments: 3, aiActionsPerMonth: 50, clients: 10 },
    highlights: ["3 active commitments", "50 AI agent actions / month", "PayPal invoices & checkout", "Client request portal", "Approval Center"],
    cta: "Start free",
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For freelancers and consultants who want every hour paid for.",
    monthlyMinor: 29_00,
    annualMonthlyMinor: 24_00,
    includedSeats: 1,
    extraSeatMinor: null,
    limits: { activeCommitments: null, aiActionsPerMonth: 1_000, clients: null },
    highlights: [
      "Unlimited commitments & clients",
      "1,000 AI agent actions / month",
      "ScopeWatch change orders",
      "ProofFlow deliverable checks",
      "Evidence Vault reports",
      "Custom TrustGate policies",
    ],
    cta: "Start 14-day Pro trial",
    featured: true,
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "For small agencies running several client projects at once.",
    monthlyMinor: 79_00,
    annualMonthlyMinor: 66_00,
    includedSeats: 3,
    extraSeatMinor: 15_00,
    limits: { activeCommitments: null, aiActionsPerMonth: 5_000, clients: null },
    highlights: [
      "Everything in Pro",
      "3 team seats included (+$15 per extra seat)",
      "5,000 shared AI agent actions / month",
      "Role-based approvals",
      "Finance reports & exports",
      "Priority support",
    ],
    cta: "Start 14-day Studio trial",
  },
];

/** Usage add-on for heavy AI users (high-margin expansion revenue). */
export const AI_ACTION_PACK = { actions: 1_000, priceMinor: 10_00 };

/** Rows for the plan comparison table. `true`/`false` or a short string per plan. */
export const PLAN_MATRIX: { group: string; rows: { label: string; values: Record<PlanId, string | boolean> }[] }[] = [
  {
    group: "Commitments",
    rows: [
      { label: "Active commitments", values: { solo: "3", pro: "Unlimited", studio: "Unlimited" } },
      { label: "Client request portal", values: { solo: true, pro: true, studio: true } },
      { label: "Commitment Timeline & VowGraph", values: { solo: true, pro: true, studio: true } },
      { label: "ScopeWatch change orders", values: { solo: "Detection only", pro: true, studio: true } },
      { label: "ProofFlow deliverable checks", values: { solo: false, pro: true, studio: true } },
      { label: "Evidence Vault dispute reports", values: { solo: false, pro: true, studio: true } },
    ],
  },
  {
    group: "Payments",
    rows: [
      { label: "PayPal invoices & checkout", values: { solo: true, pro: true, studio: true } },
      { label: "Deposits & milestone payments", values: { solo: true, pro: true, studio: true } },
      { label: "Automatic payment reconciliation", values: { solo: true, pro: true, studio: true } },
      { label: "Overdue reminders drafted by agents", values: { solo: false, pro: true, studio: true } },
      { label: "Finance reports & CSV export", values: { solo: false, pro: "Basic", studio: true } },
    ],
  },
  {
    group: "AI & control",
    rows: [
      { label: "AI agent actions / month", values: { solo: "50", pro: "1,000", studio: "5,000" } },
      { label: "TrustGate approvals", values: { solo: true, pro: true, studio: true } },
      { label: "Custom TrustGate policies", values: { solo: false, pro: true, studio: true } },
      { label: "Team seats", values: { solo: "1", pro: "1", studio: "3 included" } },
      { label: "Role-based approvals", values: { solo: false, pro: false, studio: true } },
    ],
  },
];

export function annualSavingsMinor(plan: Plan) {
  return (plan.monthlyMinor - plan.annualMonthlyMinor) * 12;
}
