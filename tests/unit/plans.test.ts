import { describe, expect, it } from "vitest";
import { annualSavingsMinor, PLAN_MATRIX, PLANS } from "@/lib/plans";

describe("plans", () => {
  it("prices are integer minor units and annual is never more expensive", () => {
    for (const p of PLANS) {
      expect(Number.isSafeInteger(p.monthlyMinor)).toBe(true);
      expect(Number.isSafeInteger(p.annualMonthlyMinor)).toBe(true);
      expect(p.annualMonthlyMinor).toBeLessThanOrEqual(p.monthlyMinor);
    }
  });

  it("annual billing on paid plans gives roughly two months free", () => {
    for (const p of PLANS.filter((x) => x.monthlyMinor > 0)) {
      const months = annualSavingsMinor(p) / p.monthlyMinor;
      expect(months).toBeGreaterThanOrEqual(1.9);
      expect(months).toBeLessThanOrEqual(2.1);
    }
  });

  it("has exactly one featured plan and unique ids", () => {
    expect(PLANS.filter((p) => p.featured)).toHaveLength(1);
    expect(new Set(PLANS.map((p) => p.id)).size).toBe(PLANS.length);
  });

  it("comparison matrix covers every plan on every row", () => {
    for (const g of PLAN_MATRIX) for (const r of g.rows) for (const p of PLANS) expect(r.values[p.id]).toBeDefined();
  });
});
