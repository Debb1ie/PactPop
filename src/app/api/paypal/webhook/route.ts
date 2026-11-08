import { getDb } from "@/server/db/client";
import { env, paypalConfigured } from "@/server/env";
import { handleVerifiedEvent, verifyWebhook, type WebhookEvent } from "@/server/paypal/webhooks";

export const dynamic = "force-dynamic";

/**
 * PayPal Sandbox webhook receiver.
 * 1. Verify the delivery with PayPal (signature check). Unverified → 400, nothing stored.
 * 2. Store the event once (duplicate deliveries are acknowledged and ignored).
 * 3. Apply it; for invoices, PayPal is re-queried before any money is recorded.
 * PayPal retries on non-2xx, so processing failures return 500.
 */
export async function POST(request: Request) {
  if (!paypalConfigured() || !env().PAYPAL_WEBHOOK_ID) return Response.json({ error: "Webhook not configured" }, { status: 503 });

  let event: WebhookEvent;
  try {
    event = (await request.json()) as WebhookEvent;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!event?.id || !event?.event_type) return Response.json({ error: "Not a PayPal event" }, { status: 400 });

  let verified = false;
  try {
    verified = await verifyWebhook(request.headers, event);
  } catch {
    return Response.json({ error: "Could not verify with PayPal" }, { status: 502 });
  }
  if (!verified) return Response.json({ error: "Signature verification failed" }, { status: 400 });

  try {
    const r = await handleVerifiedEvent(await getDb(), event);
    return Response.json({ ok: true, ...r });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Processing failed" }, { status: 500 });
  }
}
