import { describe, expect, it } from "vitest";
import { formatMoney, fromPayPalValue, parseMajorInput, percentOf, toPayPalValue } from "@/lib/money";

describe("money", () => {
  it("formats PayPal values exactly", () => {
    expect(toPayPalValue(75000)).toBe("750.00");
    expect(toPayPalValue(5)).toBe("0.05");
    expect(toPayPalValue(0)).toBe("0.00");
    expect(toPayPalValue(1200, "JPY")).toBe("1200");
  });

  it("round-trips PayPal values", () => {
    for (const v of [0, 1, 99, 100, 30000, 150000, 123456789]) expect(fromPayPalValue(toPayPalValue(v))).toBe(v);
    expect(fromPayPalValue("750")).toBe(75000);
    expect(fromPayPalValue("0.1")).toBe(10);
  });

  it("rejects bad input", () => {
    expect(() => toPayPalValue(1.5)).toThrow();
    expect(() => toPayPalValue(-1)).toThrow();
    expect(() => fromPayPalValue("1.234")).toThrow();
    expect(() => fromPayPalValue("abc")).toThrow();
    expect(parseMajorInput("1,500")).toBe(150000);
    expect(parseMajorInput("12.345")).toBeNull();
  });

  it("computes percentages without float drift", () => {
    expect(percentOf(150000, 50)).toBe(75000);
    expect(percentOf(99999, 50)).toBe(50000);
    expect(percentOf(1, 50)).toBe(1);
  });

  it("formats for display", () => {
    expect(formatMoney(150000)).toBe("$1,500.00");
    expect(formatMoney(null)).toBe("—");
  });
});
