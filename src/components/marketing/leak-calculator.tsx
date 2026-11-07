"use client";

import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

type SliderProps = { label: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void };

function Slider({ label, value, min, max, step, format, onChange }: SliderProps) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm text-white/70">
          {label}
        </label>
        <span className="money text-sm font-semibold text-white">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-[#8b7bff]"
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

  return (
    <section id="calculator" className="border-y border-white/5 bg-[#08080d] py-20 text-white/80 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center">
        <div>
          <p className="text-[0.9375rem] font-semibold text-lavender">Revenue leak calculator</p>
          <h2 className="mt-2 text-[2.25rem] font-semibold leading-tight text-white sm:text-[3rem]">How much work are you doing for free?</h2>
          <p className="mt-4 text-lg text-white/60">
            Small unbilled extras and hours spent chasing invoices add up. Move the sliders to match your business.
          </p>
          <div className="mt-8 space-y-6 rounded-[1.75rem] border border-white/[0.08] bg-white/[0.035] p-6">
            <Slider label="Client projects per month" value={projects} min={1} max={20} step={1} format={String} onChange={setProjects} />
            <Slider label="Average project value" value={value} min={250} max={20000} step={250} format={usd} onChange={setValue} />
            <Slider label="Extra work you don't bill for" value={creep} min={0} max={40} step={1} format={(v) => `${v}%`} onChange={setCreep} />
            <Slider label="Hours a month chasing payments" value={chaseHours} min={0} max={20} step={1} format={(v) => `${v}h`} onChange={setChaseHours} />
            <Slider label="Your hourly rate" value={rate} min={20} max={300} step={5} format={usd} onChange={setRate} />
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-[#2a2832] bg-[#17161d] p-8 text-white sm:p-10">
          <p className="text-sm text-white/75">Estimated revenue leaking each year</p>
          <p className="money mt-2 text-5xl font-semibold sm:text-6xl" aria-live="polite">
            {usd(total)}
          </p>
          <dl className="mt-8 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-white/15 pb-3">
              <dt className="text-white/75">Unbilled scope changes</dt>
              <dd className="money font-semibold">{usd(unbilledScope)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-white/75">Time spent chasing payments</dt>
              <dd className="money font-semibold">{usd(chasingCost)}</dd>
            </div>
          </dl>
          <p className="mt-6 rounded-xl border border-white/10 px-4 py-3 text-sm text-white/70">
            ScopeWatch prices extra asks before you do them, and PayPal invoices go out the moment work is approved. PactPop is free.
          </p>
          <ButtonLink href="/register" size="lg" variant="white" className="mt-8 w-full">
            Stop the leak <ArrowRight className="h-4 w-4" />
          </ButtonLink>
          <p className="mt-3 text-center text-xs text-white/60">Estimate based only on your inputs. Not a guarantee of results.</p>
        </div>
      </div>
    </section>
  );
}
