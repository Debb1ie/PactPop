import { describe, expect, it } from "vitest";
import { isDueForCheckout } from "@/lib/checkout";

describe("isDueForCheckout", () => {
  it("allows the unpaid deposit", () => expect(isDueForCheckout({ kind: "deposit", status: "pending" })).toBe(true));
  it("blocks the final payment until the work is approved", () => {
    expect(isDueForCheckout({ kind: "final", status: "pending" })).toBe(false);
    expect(isDueForCheckout({ kind: "final", status: "approved" })).toBe(true);
  });
  it("blocks anything already invoiced or paid", () => {
    expect(isDueForCheckout({ kind: "deposit", status: "paid" })).toBe(false);
    expect(isDueForCheckout({ kind: "deposit", status: "invoiced" })).toBe(false);
  });
  it("blocks change orders until approved as delivered", () => expect(isDueForCheckout({ kind: "change_order", status: "pending" })).toBe(false));
});
