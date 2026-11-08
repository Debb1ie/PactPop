import { formatMoney } from "@/lib/money";

type Position = {
  contractedMinor: number;
  contractedCount: number;
  receivedMinor: number;
  invoicedMinor: number;
  scheduledMinor: number;
  pendingChangeOrdersMinor: number;
  pipelineMinor: number;
  pipelineCount: number;
  collectedPct: number;
};

/**
 * Account position: contracted revenue and how much of it is received, invoiced or still
 * scheduled, as one segmented bar plus a row of hairline-separated figures.
 */
export function PositionBoard({ p, currency, sandbox }: { p: Position; currency: string; sandbox: boolean }) {
  const total = Math.max(1, p.contractedMinor);
  const seg = (v: number) => `${Math.max(0, Math.min(100, (v / total) * 100))}%`;
  const cols = [
    { label: "Received", value: p.receivedMinor, note: "PayPal-confirmed", cls: "text-money-in", swatch: "bg-money-in" },
    { label: "Invoiced", value: p.invoicedMinor, note: "awaiting payment", cls: "", swatch: "bg-accent" },
    { label: "Scheduled", value: p.scheduledMinor, note: "milestones not yet invoiced", cls: "", swatch: "bg-faint" },
    { label: "Change orders", value: p.pendingChangeOrdersMinor, note: "pending your approval", cls: p.pendingChangeOrdersMinor ? "text-warning" : "", swatch: "bg-warning" },
    { label: "Pipeline", value: p.pipelineMinor, note: `${p.pipelineCount} awaiting acceptance`, cls: "text-muted", swatch: "" },
  ];

  return (
    <section className="panel" aria-label="Account position">
      <div className="panel-head">
        <h2 className="panel-title">Account position</h2>
        <span className="ml-auto flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
          <span className="live-dot" aria-hidden /> Live{sandbox ? " · PayPal Sandbox" : ""} · {currency}
        </span>
      </div>

      <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-end">
        <div>
          <p className="label-mono">Contracted revenue</p>
          <p className="money mt-2 text-[2.5rem] font-medium leading-none sm:text-[3.25rem]">{formatMoney(p.contractedMinor, currency)}</p>
          <p className="mt-2 font-mono text-[0.75rem] text-muted">
            {p.contractedCount} agreement{p.contractedCount === 1 ? "" : "s"} · <span className="text-money-in">{p.collectedPct.toFixed(1)}% collected</span>
          </p>
        </div>
        <div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-fill" role="img" aria-label={`Received ${formatMoney(p.receivedMinor)}, invoiced ${formatMoney(p.invoicedMinor)}, scheduled ${formatMoney(p.scheduledMinor)} of ${formatMoney(p.contractedMinor)} contracted`}>
            <span className="h-full bg-money-in" style={{ width: seg(p.receivedMinor) }} />
            <span className="h-full border-l border-surface bg-accent" style={{ width: seg(p.invoicedMinor) }} />
            <span className="h-full border-l border-surface bg-faint" style={{ width: seg(p.scheduledMinor) }} />
          </div>
          <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-faint">
            <span>0</span>
            <span>{formatMoney(p.contractedMinor, currency)}</span>
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 border-t border-border sm:grid-cols-3 lg:grid-cols-5">
        {cols.map((c, i) => (
          <div key={c.label} className={`min-w-0 px-4 py-3.5 ${i > 0 ? "border-l border-border" : ""} ${i >= 2 ? "max-sm:border-t" : ""} ${i === 2 ? "max-sm:border-l-0" : ""} ${i >= 3 ? "sm:max-lg:border-t" : ""} ${i === 3 ? "sm:max-lg:border-l-0" : ""}`}>
            <dt className="flex items-center gap-1.5 label-mono">
              {c.swatch && <span className={`h-2 w-2 rounded-sm ${c.swatch}`} aria-hidden />}
              {c.label}
            </dt>
            <dd className={`money mt-1.5 text-[1.125rem] font-medium ${c.cls}`}>{formatMoney(c.value, currency)}</dd>
            <dd className="mt-0.5 truncate text-[0.75rem] text-muted">{c.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
