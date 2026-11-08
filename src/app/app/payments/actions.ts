"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { paypalConfigured } from "@/server/env";
import { PayPalError } from "@/server/paypal/client";
import { sendMilestoneInvoice, syncInvoice } from "@/server/paypal/invoices";

export type PayResult = { ok: boolean; message: string; payerUrl?: string | null };

const uuid = z.string().uuid();

function failure(e: unknown): PayResult {
  if (e instanceof PayPalError) return { ok: false, message: e.debugId ? `${e.message} (PayPal debug id ${e.debugId})` : e.message };
  return { ok: false, message: e instanceof Error ? e.message : "Something went wrong" };
}

/** Owner clicks "Send PayPal invoice" on a milestone. The click is the human approval. */
export async function sendInvoiceAction(milestoneId: string): Promise<PayResult> {
  const ctx = await requireRole(["owner", "admin"]);
  if (!uuid.safeParse(milestoneId).success) return { ok: false, message: "Invalid milestone" };
  if (!paypalConfigured()) return { ok: false, message: "PayPal Sandbox isn't connected" };
  try {
    const r = await sendMilestoneInvoice(await getDb(), { businessId: ctx.business.id, milestoneId, userId: ctx.user.id, userName: ctx.user.name });
    revalidatePath("/app", "layout");
    return { ok: r.ok, message: r.message, payerUrl: r.ok ? r.invoice.payerViewUrl : null };
  } catch (e) {
    return failure(e);
  }
}

/** Ask PayPal for the latest invoice status. Records a payment only if PayPal says it is paid. */
export async function syncInvoiceAction(invoiceId: string): Promise<PayResult> {
  const ctx = await requireRole(["owner", "admin"]);
  if (!uuid.safeParse(invoiceId).success) return { ok: false, message: "Invalid invoice" };
  try {
    const r = await syncInvoice(await getDb(), { businessId: ctx.business.id, invoiceId, via: "api" });
    revalidatePath("/app", "layout");
    return { ok: r.ok, message: r.message };
  } catch (e) {
    return failure(e);
  }
}
