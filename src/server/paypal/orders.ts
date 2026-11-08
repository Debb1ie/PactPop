import "server-only";
import { and, eq } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import { commitments, milestones, payments } from "@/server/db/schema";
import { fromPayPalValue, toPayPalValue } from "@/lib/money";
import { isDueForCheckout } from "@/lib/checkout";
import { recordAudit, recordTimeline } from "@/server/services/audit";
import { paypal, PayPalError } from "./client";

type Money = { currency_code: string; value: string };
type Capture = { id: string; status: string; amount: Money; seller_receivable_breakdown?: { paypal_fee?: Money; net_amount?: Money } };
type Order = { id: string; status: string; payer?: { email_address?: string }; purchase_units?: { reference_id?: string; payments?: { captures?: Capture[] } }[] };

/**
 * Create a PayPal checkout order for one milestone. The amount is the milestone's
 * stored amount; the client approves it in PayPal's own window.
 */
export async function createMilestoneOrder(db: Database, input: { businessId: string; milestoneId: string }) {
  const [row] = await db
    .select({ m: milestones, c: commitments })
    .from(milestones)
    .innerJoin(commitments, eq(commitments.id, milestones.commitmentId))
    .where(and(eq(milestones.id, input.milestoneId), eq(milestones.businessId, input.businessId)))
    .limit(1);
  if (!row) throw new Error("Milestone not found");
  const { m, c } = row;
  if (!["pending", "in_progress", "submitted", "approved"].includes(m.status)) throw new Error(`This payment is already ${m.status}`);
  if (!["accepted", "in_progress", "awaiting_evidence", "awaiting_approval", "payment_ready"].includes(c.status)) throw new Error("The agreement must be accepted first");
  // Only money that is due can be paid by checkout: the deposit, or work the owner has approved.
  if (!isDueForCheckout(m)) throw new Error("This payment isn't due yet. It becomes payable when the work is delivered and approved.");

  // A fresh order per checkout attempt: PayPal won't reopen an order an earlier popup already used.
  // Unfinished attempts stay "created" and never count as money.
  const order = await paypal<Order>("/v2/checkout/orders", {
    method: "POST",
    requestId: `pactpop-order-${m.id}-${Date.now()}`,
    body: {
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: m.id,
          custom_id: m.id,
          description: `${c.title} · ${m.title}`.slice(0, 127),
          amount: { currency_code: m.currency, value: toPayPalValue(m.amountMinor, m.currency) },
        },
      ],
    },
  });
  await db.insert(payments).values({
    businessId: m.businessId,
    commitmentId: c.id,
    milestoneId: m.id,
    source: "order",
    paypalOrderId: order.id,
    status: "created",
    amountMinor: m.amountMinor,
    currency: m.currency,
    isSandbox: true,
  });
  return { orderId: order.id };
}

/** Record a completed capture once: payment completed, milestone paid, timeline + audit. */
async function recordCapture(db: Database, orderId: string, capture: Capture, payerEmail: string | null, via: "api" | "webhook") {
  const [p] = await db.select().from(payments).where(eq(payments.paypalOrderId, orderId)).limit(1);
  if (!p) return { recorded: false, reason: "order not managed by PactPop" };
  if (p.status === "completed") return { recorded: false, reason: "already recorded" };
  if (capture.status !== "COMPLETED") {
    await db.update(payments).set({ status: "pending", paypalCaptureId: capture.id, updatedAt: new Date() }).where(eq(payments.id, p.id));
    return { recorded: false, reason: `capture ${capture.status.toLowerCase()}` };
  }
  const amountMinor = fromPayPalValue(capture.amount.value, capture.amount.currency_code);
  const fee = capture.seller_receivable_breakdown?.paypal_fee;
  const net = capture.seller_receivable_breakdown?.net_amount;
  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        status: "completed",
        paypalCaptureId: capture.id,
        amountMinor,
        feeMinor: fee ? fromPayPalValue(fee.value, fee.currency_code) : null,
        netMinor: net ? fromPayPalValue(net.value, net.currency_code) : null,
        payerEmail,
        verifiedVia: via,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, p.id));
    if (p.milestoneId) await tx.update(milestones).set({ status: "paid", updatedAt: new Date() }).where(eq(milestones.id, p.milestoneId));
    if (p.commitmentId) {
      await tx.update(commitments).set({ status: "in_progress", updatedAt: new Date() }).where(and(eq(commitments.id, p.commitmentId), eq(commitments.status, "accepted")));
      await recordTimeline(tx, {
        businessId: p.businessId,
        commitmentId: p.commitmentId,
        kind: "payment.received",
        title: "Payment confirmed by PayPal: client checkout",
        detail: via === "webhook" ? "Verified webhook" : "Capture confirmed by the PayPal API",
        refType: "payment",
        refId: p.id,
        actor: { type: "paypal", label: "PayPal Sandbox" },
        amountMinor,
      });
    }
    await recordAudit(tx, { businessId: p.businessId, actor: { type: "paypal", label: "PayPal Sandbox" }, action: "payment.confirmed", entityType: "payment", entityId: p.id, after: { captureId: capture.id, amountMinor, via } });
  });
  return { recorded: true, reason: "recorded" };
}

/**
 * Capture after the client approved in PayPal. Only orders PactPop created for this milestone are
 * captured; money is recorded from PayPal's capture response, never from the browser.
 */
export async function captureMilestoneOrder(db: Database, input: { orderId: string; milestoneId: string }) {
  const [p] = await db.select().from(payments).where(and(eq(payments.paypalOrderId, input.orderId), eq(payments.milestoneId, input.milestoneId))).limit(1);
  if (!p) throw new Error("Unknown order");
  if (p.status === "completed") return { ok: true, message: "Payment already confirmed" };

  let order: Order;
  try {
    order = await paypal<Order>(`/v2/checkout/orders/${input.orderId}/capture`, { method: "POST", requestId: `pactpop-capture-${input.orderId}`, body: {} });
  } catch (e) {
    if (e instanceof PayPalError && e.status === 422) order = await paypal<Order>(`/v2/checkout/orders/${input.orderId}`);
    else throw e;
  }
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) return { ok: false, message: `PayPal order status: ${order.status.toLowerCase()}` };
  const r = await recordCapture(db, input.orderId, capture, order.payer?.email_address ?? null, "api");
  const ok = capture.status === "COMPLETED";
  return { ok, message: ok ? "Payment confirmed by PayPal" : `Payment ${capture.status.toLowerCase()} at PayPal`, detail: r.reason };
}

/** PAYMENT.CAPTURE.* webhook: re-read the order from PayPal, then record if not already. */
export async function applyCaptureWebhook(db: Database, resource: Record<string, unknown>) {
  const orderId = (resource.supplementary_data as { related_ids?: { order_id?: string } } | undefined)?.related_ids?.order_id;
  if (!orderId) return "no order id";
  const order = await paypal<Order>(`/v2/checkout/orders/${orderId}`);
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) return "order has no capture";
  const r = await recordCapture(db, orderId, capture, order.payer?.email_address ?? null, "webhook");
  return r.reason;
}
