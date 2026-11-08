"use server";

import { z } from "zod";
import { getDb } from "@/server/db/client";
import { paypalConfigured } from "@/server/env";
import { PayPalError } from "@/server/paypal/client";
import { captureMilestoneOrder, createMilestoneOrder } from "@/server/paypal/orders";
import { acceptAgreement, agreementByToken } from "@/server/services/agreements";
import { clientIp, rateLimit, RateLimitError } from "@/server/security/rate-limit";

export type AcceptState = { ok?: boolean; error?: string } | undefined;

const nameSchema = z.object({ name: z.string().trim().min(2, "Type your full name to accept").max(120), agree: z.literal("on", { message: "Tick the box to confirm" }) });

const message = (e: unknown) => (e instanceof PayPalError || e instanceof RateLimitError || e instanceof Error ? e.message : "Something went wrong");

/** Client accepts the agreement by typing their name. */
export async function acceptAction(token: string, _prev: AcceptState, form: FormData): Promise<AcceptState> {
  try {
    await rateLimit("agreement-accept", 10, 15 * 60 * 1000, token.slice(0, 12));
    const parsed = nameSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const r = await acceptAgreement(await getDb(), token, { name: parsed.data.name, ip: await clientIp() });
    return r.ok ? { ok: true } : { error: r.message };
  } catch (e) {
    return { error: message(e) };
  }
}

/** Returns the milestone only if it belongs to the agreement behind this token. */
async function milestoneFor(token: string, milestoneId: string) {
  const a = await agreementByToken(await getDb(), token);
  if (!a) throw new Error("This link is no longer valid");
  const m = a.milestones.find((x) => x.m.id === milestoneId);
  if (!m) throw new Error("Payment not found");
  return { a, m: m.m };
}

/** PayPal button: create the checkout order (amount from the milestone, server-side). */
export async function createOrderAction(token: string, milestoneId: string): Promise<{ orderId?: string; error?: string }> {
  try {
    if (!paypalConfigured()) return { error: "PayPal isn't connected for this business yet" };
    await rateLimit("agreement-order", 20, 15 * 60 * 1000, token.slice(0, 12));
    const { a, m } = await milestoneFor(token, milestoneId);
    return await createMilestoneOrder(await getDb(), { businessId: a.p.businessId, milestoneId: m.id });
  } catch (e) {
    return { error: message(e) };
  }
}

/** PayPal button: client approved; capture and record from PayPal's response. */
export async function captureOrderAction(token: string, milestoneId: string, orderId: string): Promise<{ ok: boolean; message: string }> {
  try {
    if (!/^[A-Z0-9]{8,32}$/.test(orderId)) return { ok: false, message: "Invalid order" };
    const { m } = await milestoneFor(token, milestoneId);
    const r = await captureMilestoneOrder(await getDb(), { orderId, milestoneId: m.id });
    return { ok: r.ok, message: r.message };
  } catch (e) {
    return { ok: false, message: message(e) };
  }
}
