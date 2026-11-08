"use client";

import { useId, useState, type CSSProperties } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { Silk } from "./feature-visuals";

type SliderProps = { label: string; value: number; min: number; max: number; step: number; color: string; format: (v: number) => string; onChange: (v: number) => void };

/** Range input with a coloured fill that follows the value. */
function Slider({ label, value, min, max, step, color, format, onChange }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm text-white/75">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
          {label}
        </label>
        <span className="money rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-semibold text-white">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="pp-range mt-3 w-full"
        style={{ "--c": color, "--p": `${pct}%` } as CSSProperties}
      />
    </div>
  );
}

const usd = (major: number) => formatMoney(Math.round(major) * 100).replace(/\.00$/, "");

/**
 * "Revenue leak" estimator. All maths runs on the visitor's own inputs; nothing here is a claim
 * about outcomes. Uses whole dollars (display-only estimate, not a financial record).
 */
export function LeakCalculator() {
  const [projects, setProjects] = useState(4);
  const [value, setValue] = useState(2000);
  const [creep, setCreep] = useState(10);
  const [chaseHours, setChaseHours] = useState(3);
  const [rate, setRate] = useState(75);

  const unbilledScope = projects * 12 * value * (creep / 100);
  const chasingCost = chaseHours * 12 * rate;
  const total = unbilledScope + chasingCost;
  const scopeShare = total > 0 ? (unbilledScope / total) * 100 : 50;

  return (
    <section
      id="calculator"
      className="relative overflow-hidden border-y border-white/5 bg-[#08080d] bg-[radial-gradient(40rem_26rem_at_8%_10%,rgb(124_92_255/0.28),transparent_70%),radial-gradient(34rem_24rem_at_95%_90%,rgb(255_122_46/0.22),transparent_70%),radial-gradient(30rem_20rem_at_60%_0%,rgb(46_200_180/0.14),transparent_70%)] py-20 text-white/80 sm:py-28"
    >
      <div className="pp-reveal mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#ffb36b]">Revenue leak calculator</p>
          <h2 className="mt-3 text-[2.25rem] font-semibold leading-tight tracking-[-0.03em] text-white sm:text-[3rem]">
            How much work are you doing{" "}
            <span className="bg-gradient-to-r from-[#ffb36b] via-[#ff6fa8] to-[#a993ff] bg-clip-text text-transparent">for free?</span>
          </h2>
          <p className="mt-4 text-lg text-white/60">Small unbilled extras and hours spent chasing invoices add up. Move the sliders to match your business.</p>
          <div className="mt-8 space-y-6 rounded-[1.75rem] bg-white/[0.05] p-6 shadow-[0_30px_60px_-36px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.06)] backdrop-blur">
            <Slider label="Client projects per month" value={projects} min={1} max={20} step={1} color="#8b7bff" format={String} onChange={setProjects} />
            <Slider label="Average project value" value={value} min={250} max={20000} step={250} color="#3fb7ff" format={usd} onChange={setValue} />
            <Slider label="Extra work you don't bill for" value={creep} min={0} max={40} step={1} color="#ff8a3d" format={(v) => `${v}%`} onChange={setCreep} />
            <Slider label="Hours a month chasing payments" value={chaseHours} min={0} max={20} step={1} color="#ff5c9a" format={(v) => `${v}h`} onChange={setChaseHours} />
            <Slider label="Your hourly rate" value={rate} min={20} max={300} step={5} color="#34d399" format={usd} onChange={setRate} />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[radial-gradient(80%_70%_at_15%_0%,#ffb36b_0%,transparent_55%),radial-gradient(70%_70%_at_100%_100%,#5b2bd6_0%,transparent_60%),linear-gradient(150deg,#ff6a3d,#e8327f_55%,#6c3fe0)] p-8 text-white shadow-[0_40px_80px_-30px_rgb(232_50_127/0.55)] sm:p-10">
          <Silk color="#ffffff" />
          <div className="relative">
            <p className="text-sm font-medium text-white/85">Estimated revenue leaking each year</p>
            <p className="money mt-2 text-5xl font-bold tracking-[-0.03em] sm:text-7xl" aria-live="polite">
              {usd(total)}
            </p>

            <div className="mt-6 flex h-3 w-full overflow-hidden rounded-full bg-white/20" role="img" aria-label={`${Math.round(scopeShare)}% unbilled scope changes, ${100 - Math.round(scopeShare)}% time chasing payments`}>
              <span className="h-full bg-[#ffe08a] transition-[width] duration-500 ease-[var(--ease-ios)]" style={{ width: `${scopeShare}%` }} />
              <span className="h-full flex-1 bg-white/80" />
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                <dt className="flex items-center gap-2 text-white/85">
                  <span className="h-2 w-2 rounded-full bg-[#ffe08a]" aria-hidden /> Unbilled scope changes
                </dt>
                <dd className="money mt-1 text-xl font-bold">{usd(unbilledScope)}</dd>
              </div>
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                <dt className="flex items-center gap-2 text-white/85">
                  <span className="h-2 w-2 rounded-full bg-white/80" aria-hidden /> Time chasing payments
                </dt>
                <dd className="money mt-1 text-xl font-bold">{usd(chasingCost)}</dd>
              </div>
            </dl>

            <p className="mt-5 rounded-2xl bg-black/20 px-4 py-3 text-sm text-white/90 backdrop-blur">
              ScopeWatch prices extra asks before you do them, and PayPal invoices go out the moment work is approved. PactPop is free.
            </p>
            <ButtonLink href="/register" size="lg" variant="white" className="mt-6 w-full">
              Stop the leak <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <p className="mt-3 text-center text-xs text-white/75">Estimate based only on your inputs. Not a guarantee of results.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
