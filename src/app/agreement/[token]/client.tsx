"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNotice, Field, Input } from "@/components/ui/primitives";
import { acceptAction, captureOrderAction, createOrderAction, type AcceptState } from "./actions";

/** Type your name + tick to accept. */
export function AcceptForm({ token, total }: { token: string; total: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<AcceptState, FormData>(acceptAction.bind(null, token), undefined);
  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <ErrorNotice title="Couldn't accept" message={state.error} />}
      <Field label="Your full name" htmlFor="name">
        <Input id="name" name="name" autoComplete="name" required placeholder="Tom Becker" />
      </Field>
      <label className="flex items-start gap-3 text-[0.875rem] leading-relaxed">
        <input type="checkbox" name="agree" required className="mt-1 h-4 w-4 accent-[#6c4ef5]" />
        <span>
          I accept this agreement, its scope and the total of <span className="money font-semibold">{total}</span>, paid in the milestones listed.
        </span>
      </label>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Accept agreement
      </Button>
    </form>
  );
}

type PayPalNamespace = {
  Buttons: (o: {
    style?: Record<string, unknown>;
    createOrder: () => Promise<string>;
    onApprove: (d: { orderID: string }) => Promise<void>;
    onError: (e: unknown) => void;
    onCancel?: () => void;
  }) => { render: (el: HTMLElement) => Promise<void>; close?: () => void };
};

let sdk: Promise<PayPalNamespace> | null = null;
function loadSdk(clientId: string, currency: string): Promise<PayPalNamespace> {
  if (sdk) return sdk;
  sdk = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons`;
    s.async = true;
    s.onload = () => resolve((window as unknown as { paypal: PayPalNamespace }).paypal);
    s.onerror = () => {
      sdk = null;
      reject(new Error("PayPal could not load"));
    };
    document.head.appendChild(s);
  });
  return sdk;
}

/** PayPal Smart Buttons for one milestone. The server creates and captures the order. */
export function PayButtons({ token, milestoneId, clientId, currency }: { token: string; milestoneId: string; clientId: string; currency: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [status, setStatus] = useState<{ tone: "error" | "ok" | "info"; text: string } | null>(null);

  // Render PayPal's buttons exactly once per mount. (React dev mode runs effects twice; a second
  // Buttons instance would create duplicate orders and close the first instance's checkout popup.)
  // The parent keys this component by milestone, so the next payment gets a fresh mount.
  const rendered = useRef(false);
  useEffect(() => {
    if (rendered.current) return;
    rendered.current = true;
    loadSdk(clientId, currency)
      .then((paypal) => {
        if (!ref.current) return;
        ref.current.innerHTML = "";
        const instance = paypal.Buttons({
          style: { layout: "vertical", shape: "pill", label: "pay", height: 48 },
          createOrder: async () => {
            setStatus(null);
            const r = await createOrderAction(token, milestoneId);
            if (!r.orderId) throw new Error(r.error ?? "Couldn't start the payment");
            return r.orderId;
          },
          onApprove: async ({ orderID }) => {
            setStatus({ tone: "info", text: "Confirming your payment with PayPal…" });
            const r = await captureOrderAction(token, milestoneId, orderID);
            setStatus({ tone: r.ok ? "ok" : "error", text: r.message });
            router.refresh();
          },
          onCancel: () => setStatus({ tone: "info", text: "Payment cancelled. Nothing was charged." }),
          onError: (e) => setStatus({ tone: "error", text: e instanceof Error ? e.message : "PayPal reported an error. Nothing was charged." }),
        });
        void instance.render(ref.current);
      })
      .catch((e: Error) => setStatus({ tone: "error", text: e.message }));
  }, [clientId, currency, milestoneId, token, router]);

  return (
    <div>
      <div ref={ref} className="min-h-[3.25rem]" />
      {status && (
        <p className={status.tone === "error" ? "mt-3 text-[0.875rem] text-[#c0303c]" : status.tone === "ok" ? "mt-3 flex items-center gap-2 text-[0.875rem] font-medium text-[#1f8a4c]" : "mt-3 text-[0.875rem] text-muted"}>
          {status.tone === "ok" && <CheckCircle2 className="h-4 w-4" />} {status.text}
        </p>
      )}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[0.75rem] text-muted">
        <Lock className="h-3 w-3" /> Paid securely through PayPal (Sandbox). PactPop never sees your card or PayPal login.
      </p>
    </div>
  );
}

export function InvoiceLink({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#ffc439] text-[0.9375rem] font-semibold text-[#111] transition hover:brightness-95">
      Pay the invoice on PayPal <ExternalLink className="h-4 w-4" />
    </a>
  );
}
