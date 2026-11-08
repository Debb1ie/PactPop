import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";
import { getDb } from "@/server/db/client";
import { env, paypalConfigured } from "@/server/env";
import { agreementByToken } from "@/server/services/agreements";
import { AcceptForm, InvoiceLink, PayButtons } from "./client";

export const metadata: Metadata = { title: "Your agreement", robots: { index: false } };

const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "On acceptance");

/** The client's one link: review → accept → pay the deposit with PayPal. */
export default async function AgreementPage({ params }: PageProps<"/agreement/[token]">) {
  const { token } = await params;
  const a = await agreementByToken(await getDb(), token);
  if (!a) notFound();
  const cur = a.p.currency;
  const accepted = a.p.status === "accepted" || !["awaiting_acceptance", "proposed"].includes(a.c.status);
  const next = a.milestones.find((x) => !["paid", "cancelled"].includes(x.m.status));
  const paidAll = accepted && a.milestones.length > 0 && !next;
  const lastPaid = [...a.milestones].reverse().find((x) => x.m.status === "paid");

  return (
    <div className="force-light min-h-screen bg-[radial-gradient(60rem_30rem_at_10%_-10%,#ece6ff,transparent_60%),radial-gradient(50rem_30rem_at_100%_0%,#ffe9d8,transparent_60%)] text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <p className="text-center font-[family-name:var(--font-brand)] text-[1rem] font-semibold uppercase tracking-[0.06em] text-[#0d0d10]/70">PactPop</p>

        <div className="mt-8 text-center">
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#6c4ef5]">Agreement from {a.biz.name}</p>
          <h1 className="mt-2 text-balance text-[2rem] font-semibold leading-tight tracking-[-0.03em] sm:text-[2.5rem]">{a.p.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted">{a.p.summary}</p>
          {a.biz.isDemo && <p className="mt-3 text-[0.75rem] text-muted">Demo workspace · PayPal Sandbox · no real money moves</p>}
        </div>

        {/* total card */}
        <div className="relative mt-8 overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#4b2fd1] via-[#7c5cff] to-[#b18cff] p-6 text-white shadow-[0_30px_60px_-30px_rgb(76_47_209/0.7)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.8125rem] text-white/75">Prepared for {a.client.company ?? a.client.name}</p>
              <p className="money mt-2 text-[2.5rem] font-bold leading-none">{formatMoney(a.p.totalMinor, cur)}</p>
              <p className="mt-2 text-[0.8125rem] text-white/80">{a.p.paymentTerms}</p>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-[0.75rem] font-medium backdrop-blur">
              {paidAll ? "Paid in full" : accepted ? `Accepted${a.p.acceptedByName ? ` by ${a.p.acceptedByName}` : ""}` : "Waiting for you"}
            </span>
          </div>
        </div>

        {/* scope */}
        <section className="pure mt-4 rounded-[1.5rem] p-6">
          <h2 className="text-[1.0625rem] font-semibold">What&apos;s included</h2>
          <ul className="mt-3 space-y-2">
            {a.p.scopeItems.map((s) => (
              <li key={s.title} className="flex items-start gap-2.5 text-[0.9375rem]">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#6c4ef5] text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span>
                  {s.title}
                  {s.detail && <span className="text-muted"> · {s.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
          {a.p.exclusions.length > 0 && (
            <p className="mt-4 text-[0.8125rem] text-muted">
              <span className="font-medium text-foreground">Not included:</span> {a.p.exclusions.join(", ")}. Extra requests are priced as a change order before any work starts.
            </p>
          )}
          <table className="mt-5 w-full text-[0.875rem]">
            <tbody>
              {a.p.pricing.map((l) => (
                <tr key={l.label} className="border-t border-border">
                  <td className="py-2">{l.label}</td>
                  <td className="py-2 text-muted">× {l.quantity}</td>
                  <td className="money py-2 text-right">{formatMoney(l.totalMinor, cur)}</td>
                </tr>
              ))}
              <tr className="border-t border-border font-semibold">
                <td className="py-2" colSpan={2}>
                  Total
                </td>
                <td className="money py-2 text-right">{formatMoney(a.p.totalMinor, cur)}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* milestones */}
        <section className="pure mt-4 rounded-[1.5rem] p-6">
          <h2 className="text-[1.0625rem] font-semibold">Payments</h2>
          <ol className="mt-3 space-y-2.5">
            {(accepted && a.milestones.length ? a.milestones.map((x) => ({ title: x.m.title, amountMinor: x.m.amountMinor, due: fmtDate(x.m.dueDate), status: x.m.status })) : a.p.milestonePlan.map((m) => ({ title: m.title, amountMinor: m.amountMinor, due: m.dueInDays === 0 ? "On acceptance" : `${m.dueInDays} days after acceptance`, status: "planned" }))).map((m) => (
              <li key={m.title} className="flex items-center gap-3 text-[0.9375rem]">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", m.status === "paid" ? "bg-[#24a148]" : m.status === "invoiced" ? "bg-[#0a62d0]" : "bg-[#0d0d10]/25")} aria-hidden />
                <span className="min-w-0 flex-1">
                  {m.title} <span className="text-[0.8125rem] text-muted">· {m.due}</span>
                </span>
                <span className="text-[0.75rem] text-muted">{m.status === "paid" ? "Paid" : m.status === "invoiced" ? "Invoiced" : m.status === "planned" ? "" : "Due"}</span>
                <span className="money font-medium">{formatMoney(m.amountMinor, cur)}</span>
              </li>
            ))}
          </ol>
        </section>

        {lastPaid && !paidAll && (
          <p className="pure mt-4 flex items-center gap-2.5 rounded-[1.25rem] px-5 py-3.5 text-[0.9375rem]">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#24a148]" />
            <span>
              <span className="font-semibold">{lastPaid.m.title}</span> received · <span className="money">{formatMoney(lastPaid.m.amountMinor, cur)}</span>, confirmed by PayPal. Thank you!
            </span>
          </p>
        )}

        {/* action */}
        <section className="pure mt-4 rounded-[1.5rem] p-6">
          {!accepted ? (
            <>
              <h2 className="text-[1.0625rem] font-semibold">Accept the agreement</h2>
              <p className="mb-4 mt-1 text-[0.875rem] text-muted">Accepting locks in this scope and price. Changes later go through a change order you approve.</p>
              <AcceptForm token={token} total={formatMoney(a.p.totalMinor, cur)} />
            </>
          ) : paidAll ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#24a148]" />
              <p className="mt-3 text-[1.0625rem] font-semibold">All payments are complete. Thank you!</p>
            </div>
          ) : next ? (
            <>
              <h2 className="text-[1.0625rem] font-semibold">
                Pay {next.m.title.toLowerCase()} · <span className="money">{formatMoney(next.m.amountMinor, cur)}</span>
              </h2>
              <p className="mb-4 mt-1 text-[0.875rem] text-muted">Only this payment is due now. {a.biz.name} confirms the rest as work is delivered.</p>
              {next.invoiceUrl && next.invoiceStatus !== "paid" ? (
                <InvoiceLink url={next.invoiceUrl} />
              ) : paypalConfigured() ? (
                <PayButtons key={next.m.id} token={token} milestoneId={next.m.id} clientId={env().PAYPAL_CLIENT_ID!} currency={cur} />
              ) : (
                <p className="text-[0.875rem] text-muted">{a.biz.name} will send a PayPal invoice for this payment.</p>
              )}
            </>
          ) : null}
        </section>
        <p className="mt-6 text-center text-[0.75rem] text-muted">Questions? Reply to {a.biz.name} directly. This page is private to you; don&apos;t share the link.</p>
      </div>
    </div>
  );
}
