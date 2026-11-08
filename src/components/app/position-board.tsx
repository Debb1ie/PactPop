import { cn } from "@/lib/cn";
import { LogoMark } from "@/components/brand/logo";
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

function Mark() {
  return <LogoMark variant="mono" className="h-6 w-6" title="" />;
}

/**
 * Account position as gradient cards: a hero card with contracted revenue and a collection bar,
 * plus four figure cards. Amounts all come from the ledger; only PayPal-confirmed money counts as received.
 */
export function PositionBoard({ p, currency, sandbox }: { p: Position; currency: string; sandbox: boolean }) {
  const total = Math.max(1, p.contractedMinor);
  const seg = (v: number) => `${Math.max(0, Math.min(100, (v / total) * 100))}%`;
  const tiles = [
    { art: "card-art-lime", label: "Received", value: p.receivedMinor, note: "PayPal-confirmed" },
    { art: "card-art-orchid", label: "Invoiced", value: p.invoicedMinor, note: "awaiting payment" },
    { art: "card-art-plum", label: "Scheduled", value: p.scheduledMinor, note: "not yet invoiced" },
    { art: "card-art-ember", label: "Change orders", value: p.pendingChangeOrdersMinor, note: "pending your approval" },
  ];

  return (
    <section aria-label="Account position" className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="card-art-ice relative flex min-h-[15rem] flex-col overflow-hidden rounded-[1.5rem] p-6 text-white shadow-[0_24px_50px_-26px_rgb(10_40_160/0.8)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[0.875rem] font-semibold">
            <Mark /> Account position
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[0.7rem] font-medium backdrop-blur">
            <span className="live-dot" aria-hidden /> Live{sandbox ? " · Sandbox" : ""} · {currency}
          </span>
        </div>
        <p className="mt-6 text-[0.8125rem] text-white/75">Contracted revenue</p>
        <p className="money mt-1 text-[2.5rem] font-bold leading-none sm:text-[3rem]">{formatMoney(p.contractedMinor, currency)}</p>
        <div className="mt-auto pt-6">
          <div
            className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/20"
            role="img"
            aria-label={`Received ${formatMoney(p.receivedMinor)}, invoiced ${formatMoney(p.invoicedMinor)}, scheduled ${formatMoney(p.scheduledMinor)} of ${formatMoney(p.contractedMinor)} contracted`}
          >
            <span className="h-full bg-[#d7ee6e]" style={{ width: seg(p.receivedMinor) }} />
            <span className="h-full bg-[#ff8ad8]" style={{ width: seg(p.invoicedMinor) }} />
            <span className="h-full bg-white/55" style={{ width: seg(p.scheduledMinor) }} />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[0.75rem] text-white/80">
            <span>
              {p.contractedCount} agreement{p.contractedCount === 1 ? "" : "s"} · <span className="font-semibold text-white">{p.collectedPct.toFixed(1)}%</span> collected
            </span>
            {p.pipelineMinor > 0 && (
              <span>
                <span className="money font-semibold text-white">{formatMoney(p.pipelineMinor, currency)}</span> in pipeline · {p.pipelineCount} awaiting acceptance
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className={cn("relative flex min-h-[7rem] flex-col overflow-hidden rounded-[1.25rem] p-4 text-white shadow-[0_18px_40px_-24px_rgb(0_0_0/0.75)]", t.art)}>
            <dt className="text-[0.75rem] font-medium text-white/80">{t.label}</dt>
            <dd className="money mt-auto text-[1.375rem] font-bold leading-tight">{formatMoney(t.value, currency)}</dd>
            <dd className="text-[0.7rem] text-white/70">{t.note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
