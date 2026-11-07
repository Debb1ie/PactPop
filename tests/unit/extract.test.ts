import { describe, expect, it } from "vitest";
import { analyzeRequestText, analyzeScopeText, detectBudgetMinor, detectPageCount, detectTimelineDays } from "@/server/agents/extract";
import { DEFAULT_PRICING_RULES } from "@/server/services/pricing";

const NORTHWIND =
  "Hi! We need our bakery website redesigned before our spring menu launch. We're thinking 5 pages: Home, Menu, About, Catering and Contact. " +
  "It has to look great on phones since most customers find us on mobile, and we'd like basic SEO so we show up for 'bakery near me'. " +
  "Our budget is around $1,500 and we'd love it done in two weeks.";

describe("intake extraction", () => {
  it("extracts the demo request exactly", () => {
    const a = analyzeRequestText(NORTHWIND);
    expect(a.projectType).toBe("Website redesign");
    expect(a.estimate.pages).toBe(5);
    expect(a.estimate.features.sort()).toEqual(["basic seo", "responsive design"]);
    expect(a.budgetMinor).toBe(150000);
    expect(a.timelineDays).toBe(14);
    expect(a.deliverables).toEqual(["Home", "Menu", "About", "Catering", "Contact"]);
  });

  it("asks instead of guessing when facts are missing", () => {
    const a = analyzeRequestText("We run kite tours and need a site where people can book a lesson.");
    expect(a.budgetMinor).toBeNull();
    expect(a.missingInfo).toContain("Budget");
    expect(a.followUpQuestions.length).toBeGreaterThan(0);
    expect(a.estimate.features).toContain("booking system");
  });

  it("parses numbers, money and durations", () => {
    expect(detectPageCount("maybe four pages plus booking")).toBe(4);
    expect(detectBudgetMinor("around $2k")).toBe(200000);
    expect(detectTimelineDays("within a month")).toBe(30);
  });
});

describe("ScopeWatch analysis", () => {
  const agreed = { pageNames: ["Home", "Menu", "About", "Catering", "Contact"], pageCount: 5, features: ["responsive design", "basic seo"] };

  it("detects three extra named pages", () => {
    const r = analyzeScopeText("Could we also add a Team page, a Gallery and an FAQ?", agreed, DEFAULT_PRICING_RULES.featureHours);
    expect(r.classification).toBe("additional");
    expect(r.additions.map((a) => a.item)).toEqual(["Team page", "Gallery page", "FAQ page"]);
    expect(r.additions.reduce((s, a) => s + a.pages, 0)).toBe(3);
  });

  it("reads a list after “asked for”", () => {
    const r = analyzeScopeText("a Team page, a Gallery and an FAQ. Check the scope.", agreed, DEFAULT_PRICING_RULES.featureHours);
    expect(r.additions.map((a) => a.item)).toEqual(["Team page", "Gallery page", "FAQ page"]);
  });

  it("prices a new feature from catalogue hours", () => {
    const r = analyzeScopeText("they want a booking system too", agreed, DEFAULT_PRICING_RULES.featureHours);
    expect(r.additions).toEqual([{ item: "Booking system", rationale: "Not part of the agreed scope.", pages: 0, hours: 12 }]);
  });

  it("does not flag agreed pages", () => {
    const r = analyzeScopeText("Can you tweak the Menu page colours?", agreed, DEFAULT_PRICING_RULES.featureHours);
    expect(r.additions).toEqual([]);
    expect(r.classification).toBe("revision");
  });
});
