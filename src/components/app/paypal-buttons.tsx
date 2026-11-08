"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw, Send } from "lucide-react";
import { sendInvoiceAction, syncInvoiceAction } from "@/app/app/payments/actions";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const pill =
  "pure inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.75rem] font-medium text-foreground transition-opacity hover:opacity-80 disabled:opacity-50";

/** Owner action: create + send the PayPal Sandbox invoice for this milestone. */
export function SendInvoiceButton({ milestoneId }: { milestoneId: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await sendInvoiceAction(milestoneId);
          toast({ tone: r.ok ? "success" : "error", title: r.message, description: r.ok && r.payerUrl ? "Open the payer page from PayPal invoices to pay with a Sandbox account." : undefined });
          router.refresh();
        })
      }
      className={pill}
    >
      <Send className={cn("h-3.5 w-3.5 text-[#0a62d0]", pending && "animate-pulse")} /> {pending ? "Sending…" : "Send PayPal invoice"}
    </button>
  );
}

/** Ask PayPal for the invoice's current status (server-side verification). */
export function SyncInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  const router = useRouter();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label="Check payment status with PayPal"
      onClick={() =>
        start(async () => {
          const r = await syncInvoiceAction(invoiceId);
          toast({ tone: r.ok ? "success" : "error", title: r.message });
          router.refresh();
        })
      }
      className={pill}
    >
      <RefreshCw className={cn("h-3.5 w-3.5 text-muted", pending && "animate-spin")} /> Check
    </button>
  );
}
