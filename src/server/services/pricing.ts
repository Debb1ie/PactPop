/**
 * Pricing engine — deterministic business rules.
 *
 * The Pricing Agent may propose *units* (pages, features, hours); only this module turns units
 * into money. AI-generated text is never trusted as a price.
 */
import { assertMinor, percentOf } from "@/lib/money";
import type { MilestonePlan, PricingBreakdown, PricingRules } from "@/server/db/schema";

export const DEFAULT_PRICING_RULES: PricingRules = {
  pageRateMinor: 200_00,
  additionalPageRateMinor: 100_00,
  hourlyRateMinor: 100_00,
  depositPercent: 50,
  minimumProjectMinor: 500_00,
  featureHours: {
    "responsive design": 3,
    "basic seo": 2,
    "contact form": 2,
    "booking system": 12,
    blog: 6,
    "e-commerce": 30,
    "cms integration": 8,
    "analytics setup": 1,
    copywriting: 6,
    "logo design": 8,
  },
};

export type Estimate = {
  pages: number;
  /** Feature catalogue keys. Unknown features are reported, never priced by guesswork. */
  features: string[];
  extraHours: number;
};

export type Quote = {
  breakdown: PricingBreakdown;
  totalMinor: number;
  explanation: string[];
  unknownFeatures: string[];
};

function line(label: string, quantity: number, unitMinor: number) {
  return { label, quantity, unitMinor, totalMinor: assertMinor(quantity * unitMinor) };
}

export function normalizeFeature(f: string): string {
  return f.trim().toLowerCase().replace(/\s+/g, " ");
}

function assertUnits(n: number, name: string, max: number) {
  if (!Number.isInteger(n) || n < 0 || n > max) throw new Error(`${name} must be an integer between 0 and ${max}`);
}

export function quoteProject(estimate: Estimate, rules: PricingRules): Quote {
  assertUnits(estimate.pages, "pages", 200);
  assertUnits(estimate.extraHours, "extraHours", 2000);

  const breakdown: PricingBreakdown = [];
  const explanation: string[] = [];
  const unknownFeatures: string[] = [];

  if (estimate.pages > 0) {
    breakdown.push(line("Designed & built pages", estimate.pages, rules.pageRateMinor));
    explanation.push(`${estimate.pages} page(s) × page rate`);
  }
  for (const key of [...new Set(estimate.features.map(normalizeFeature))]) {
    const hours = rules.featureHours[key];
    if (hours === undefined) {
      unknownFeatures.push(key);
      continue;
    }
    breakdown.push(line(`${key[0].toUpperCase()}${key.slice(1)} (${hours}h)`, hours, rules.hourlyRateMinor));
    explanation.push(`${key}: ${hours}h from the feature catalogue × hourly rate`);
  }
  if (estimate.extraHours > 0) {
    breakdown.push(line("Additional custom work (hours)", estimate.extraHours, rules.hourlyRateMinor));
    explanation.push(`${estimate.extraHours} extra hour(s) × hourly rate`);
  }

  let totalMinor = breakdown.reduce((s, l) => s + l.totalMinor, 0);
  if (totalMinor < rules.minimumProjectMinor) {
    breakdown.push(line("Minimum project adjustment", 1, rules.minimumProjectMinor - totalMinor));
    explanation.push("Raised to the minimum project size");
    totalMinor = rules.minimumProjectMinor;
  }
  return { breakdown, totalMinor: assertMinor(totalMinor), explanation, unknownFeatures };
}

/** Change orders price new pages at the additional-page rate (they reuse the agreed design system). */
export function quoteChangeOrder(additions: { pages: number; hours: number }, rules: PricingRules): Quote {
  assertUnits(additions.pages, "pages", 200);
  assertUnits(additions.hours, "hours", 2000);
  const breakdown: PricingBreakdown = [];
  const explanation: string[] = [];
  if (additions.pages > 0) {
    breakdown.push(line("Additional pages (existing design system)", additions.pages, rules.additionalPageRateMinor));
    explanation.push(`${additions.pages} additional page(s) × additional-page rate`);
  }
  if (additions.hours > 0) {
    breakdown.push(line("Additional feature work (hours)", additions.hours, rules.hourlyRateMinor));
    explanation.push(`${additions.hours} hour(s) × hourly rate`);
  }
  const totalMinor = breakdown.reduce((s, l) => s + l.totalMinor, 0);
  return { breakdown, totalMinor, explanation, unknownFeatures: [] };
}

/** Split a total into deposit + final payment, summing exactly to the total. */
export function planMilestones(totalMinor: number, rules: PricingRules, timelineDays: number): MilestonePlan[] {
  assertMinor(totalMinor);
  const deposit = percentOf(totalMinor, rules.depositPercent);
  const plan: MilestonePlan[] = [];
  if (deposit > 0) plan.push({ title: `Deposit (${rules.depositPercent}%)`, kind: "deposit", amountMinor: deposit, dueInDays: 0 });
  plan.push({ title: "Final delivery", kind: "final", amountMinor: totalMinor - deposit, dueInDays: Math.max(1, timelineDays) });
  return plan;
}
