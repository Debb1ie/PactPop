import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DocToolbar } from "@/components/docs/doc-toolbar";
import { InvoiceDocument } from "@/components/docs/invoice-document";
import { requireAuth } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { sampleInvoice } from "@/server/services/invoice-docs";

export const metadata: Metadata = { title: "Invoice preview" };

/** Full-page invoice sample for a milestone (nothing is sent to PayPal from here). */
export default async function InvoiceSamplePage({ params }: PageProps<"/app/payments/invoice-sample/[milestoneId]">) {
  const ctx = await requireAuth();
  const { milestoneId } = await params;
  if (!z.string().uuid().safeParse(milestoneId).success) notFound();
  const doc = await sampleInvoice(await getDb(), ctx.business.id, milestoneId);
  if (!doc) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <DocToolbar back="/app/command" backLabel="AI Agents" fileName={`invoice-preview-${doc.number}`} />
      <div id="print-area">
        <InvoiceDocument doc={doc} />
      </div>
    </div>
  );
}
