import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING_RULES, planMilestones, quoteChangeOrder, quoteProject } from "@/server/services/pricing";

describe("pricing engine", () => {
  it("prices the demo website redesign at $1,500", () => {
    const q = quoteProject({ pages: 5, features: ["Responsive design", "basic SEO"], extraHours: 0 }, DEFAULT_PRICING_RULES);
    expect(q.totalMinor).toBe(150000);
    expect(q.breakdown.reduce((s, l) => s + l.totalMinor, 0)).toBe(q.totalMinor);
  });

  it("splits into a $750 deposit and a final payment that sum exactly", () => {
    expect(planMilestones(150000, DEFAULT_PRICING_RULES, 14).map((m) => m.amountMinor)).toEqual([75000, 75000]);
    const odd = planMilestones(100001, DEFAULT_PRICING_RULES, 14);
    expect(odd.reduce((s, m) => s + m.amountMinor, 0)).toBe(100001);
  });

  it("prices 3 additional pages as a $300 change order", () => {
    expect(quoteChangeOrder({ pages: 3, hours: 0 }, DEFAULT_PRICING_RULES).totalMinor).toBe(30000);
  });

  it("flags unknown features instead of inventing a price", () => {
    const q = quoteProject({ pages: 1, features: ["teleportation"], extraHours: 0 }, DEFAULT_PRICING_RULES);
    expect(q.unknownFeatures).toEqual(["teleportation"]);
  });

  it("applies the minimum project size", () => {
    expect(quoteProject({ pages: 1, features: [], extraHours: 0 }, DEFAULT_PRICING_RULES).totalMinor).toBe(50000);
  });

  it("rejects nonsense units", () => {
    expect(() => quoteProject({ pages: -1, features: [], extraHours: 0 }, DEFAULT_PRICING_RULES)).toThrow();
    expect(() => quoteProject({ pages: 2.5, features: [], extraHours: 0 }, DEFAULT_PRICING_RULES)).toThrow();
  });
});
