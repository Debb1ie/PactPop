import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/logo";
import type { InvoiceDocData } from "@/lib/docs";
import { formatMoney } from "@/lib/money";

const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

const STAMP: Record<string, { text: string; cls: string }> = {
  paid: { text: "PAID", cls: "border-[#1f8a4c] text-[#1f8a4c]" },
  marked_as_paid: { text: "PAID", cls: "border-[#1f8a4c] text-[#1f8a4c]" },
  sample: { text: "SAMPLE", cls: "border-[#6c4ef5] text-[#6c4ef5]" },
  draft: { text: "DRAFT", cls: "border-[#62626e] text-[#62626e]" },
  cancelled: { text: "CANCELLED", cls: "border-[#c0303c] text-[#c0303c]" },
  refunded: { text: "REFUNDED", cls: "border-[#c0303c] text-[#c0303c]" },
};

/**
 * A printable invoice on white "paper". Always light, whatever the app theme, so it prints and
 * exports the way a client would receive it.
 */
export function InvoiceDocument({ doc, children }: { doc: InvoiceDocData; children?: ReactNode }) {
  const stamp = STAMP[doc.status] ?? { text: doc.status.replace(/_/g, " ").toUpperCase(), cls: "border-[#0a62d0] text-[#0a62d0]" };
  return (
    <article className="relative overflow-hidden rounded-2xl bg-white p-6 text-[#0d0d10] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)] ring-1 ring-black/5 sm:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(124_92_255/0.18),transparent_65%)]" aria-hidden />

      <header className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-3">
          <LogoMark className="h-11 w-11" title="" />
          <div>
            <p className="text-[1.125rem] font-bold">{doc.business.name}</p>
            {doc.business.email && <p className="text-[0.8125rem] text-[#62626e]">{doc.business.email}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-[#62626e]">{doc.kind === "sample" ? "Invoice preview" : "Invoice"}</p>
          <p className="font-mono text-[1.125rem] font-semibold">#{doc.number}</p>
          <span className={`mt-2 inline-block rotate-[-4deg] rounded-md border-2 px-2.5 py-0.5 text-[0.8125rem] font-black tracking-[0.18em] ${stamp.cls}`}>{stamp.text}</span>
        </div>
      </header>

      <section className="relative mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#62626e]">Bill to</p>
          <p className="mt-1 font-semibold">{doc.client.name}</p>
          {doc.client.company && <p className="text-[0.875rem]">{doc.client.company}</p>}
          {doc.client.email && <p className="text-[0.8125rem] text-[#62626e]">{doc.client.email}</p>}
        </div>
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-[#62626e]">Agreement</p>
          <p className="mt-1 font-semibold">{doc.agreement}</p>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.875rem] sm:justify-self-end">
          <dt className="text-[#62626e]">Issued</dt>
          <dd className="text-right">{date(doc.issuedAt)}</dd>
          <dt className="text-[#62626e]">Due</dt>
          <dd className="text-right">{date(doc.dueAt)}</dd>
          {doc.paidAt && (
            <>
              <dt className="text-[#62626e]">Paid</dt>
              <dd className="text-right font-semibold text-[#1f8a4c]">{date(doc.paidAt)}</dd>
            </>
          )}
        </dl>
      </section>

      <table className="relative mt-8 w-full text-[0.875rem]">
        <thead>
          <tr className="border-b-2 border-[#0d0d10] text-left text-[0.7rem] uppercase tracking-[0.1em] text-[#62626e]">
            <th className="pb-2 font-semibold">Item</th>
            <th className="pb-2 text-right font-semibold">Qty</th>
            <th className="pb-2 text-right font-semibold">Price</th>
            <th className="pb-2 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((it) => (
            <tr key={it.name} className="border-b border-[#ececf0]">
              <td className="py-3">
                <p className="font-semibold">{it.name}</p>
                {it.description && <p className="text-[0.8125rem] text-[#62626e]">{it.description}</p>}
              </td>
              <td className="py-3 text-right">{it.quantity}</td>
              <td className="money py-3 text-right">{formatMoney(it.unitMinor, doc.currency)}</td>
              <td className="money py-3 text-right font-semibold">{formatMoney(it.totalMinor, doc.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="relative mt-4 flex justify-end">
        <dl className="w-full max-w-xs space-y-1 text-[0.875rem]">
          <div className="flex justify-between">
            <dt className="text-[#62626e]">Subtotal</dt>
            <dd className="money">{formatMoney(doc.totalMinor, doc.currency)}</dd>
          </div>
          <div className="flex justify-between border-t-2 border-[#0d0d10] pt-2 text-[1.125rem] font-bold">
            <dt>Total {doc.paidAt ? "paid" : "due"}</dt>
            <dd className="money">{formatMoney(doc.totalMinor, doc.currency)}</dd>
          </div>
        </dl>
      </div>

      <footer className="relative mt-8 grid gap-4 border-t border-[#ececf0] pt-5 text-[0.8125rem] text-[#62626e] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          {doc.note && <p>{doc.note}</p>}
          <p className="mt-1">
            Payment through <span className="font-semibold text-[#003087]">PayPal</span>
            {doc.paypal?.sandbox ? " (Sandbox: test money only)" : ""}.{" "}
            {doc.paypal?.invoiceId ? (
              <>
                PayPal invoice ID <span className="font-mono text-[#0d0d10]">{doc.paypal.invoiceId}</span>
              </>
            ) : doc.kind === "sample" ? (
              "This is a preview; nothing has been sent."
            ) : null}
          </p>
        </div>
        <p className="font-[family-name:var(--font-brand)] text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#0d0d10]/50">Made with PactPop</p>
      </footer>
      {children}
    </article>
  );
}
