"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

type CardData = { color: string; client: string; ref: string; amount: string; date: string; version: string };

const COLUMNS: CardData[][] = [
  [
    { color: "fc-orange", client: "Northwind Bakery", ref: "PP26 0415 2231 1500", amount: "1,500.00", date: "11/26", version: "v2" },
    { color: "fc-violet", client: "Kitefly Tours", ref: "PP26 7781 0932 4800", amount: "4,800.00", date: "12/26", version: "v1" },
    { color: "fc-red", client: "Atlas Dental", ref: "PP26 1190 5520 2250", amount: "2,250.00", date: "01/27", version: "v1" },
  ],
  [
    { color: "fc-teal", client: "Becker Legal", ref: "PP26 3302 7714 2700", amount: "2,700.00", date: "12/26", version: "v1" },
    { color: "fc-navy", client: "Lumen Studio", ref: "PP26 8840 1102 9600", amount: "9,600.00", date: "02/27", version: "v3" },
    { color: "fc-white", client: "Juniper Yoga", ref: "PP26 5521 6608 1200", amount: "1,200.00", date: "11/26", version: "v1" },
  ],
  [
    { color: "fc-lime", client: "Sora Ceramics", ref: "PP26 2290 4417 3600", amount: "3,600.00", date: "03/27", version: "v1" },
    { color: "fc-pink", client: "Harbor & Co", ref: "PP26 6614 3390 5100", amount: "5,100.00", date: "01/27", version: "v2" },
    { color: "fc-green", client: "Field Notes", ref: "PP26 9915 2208 750", amount: "750.00", date: "12/26", version: "v1" },
  ],
];

function Mark({ dark }: { dark?: boolean }) {
  const c = dark ? "#121218" : "white";
  return (
    <svg viewBox="0 0 64 28" className="h-5 w-10" aria-hidden>
      <path d="M6 22 C18 22 22 6 32 6 C42 6 46 22 58 22" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="6" cy="22" r="4.5" fill={c} />
      <circle cx="58" cy="22" r="4.5" fill={c} />
    </svg>
  );
}

function FinCard({ d }: { d: CardData }) {
  const dark = d.color === "fc-white";
  return (
    <div
      className={cn(
        "fc aspect-[1.586] w-[18rem] rounded-[1.1rem] p-5 text-white transition-transform duration-500 ease-[var(--ease-ios)] hover:-translate-y-3 hover:[transform:translateZ(40px)] sm:w-[20rem]",
        "shadow-[0_2px_0_rgb(255_255_255/0.15)_inset,0_30px_45px_-18px_rgb(0_0_0/0.85),0_12px_20px_-12px_rgb(0_0_0/0.6)]",
        d.color,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[0.8125rem] font-semibold">
          <Mark dark={dark} /> PactPop
        </span>
        <span className={cn("text-[0.7rem] font-bold uppercase tracking-[0.1em]", dark ? "text-[#6c4ef5]" : "text-white/85")}>{d.version}</span>
      </div>
      <p className="money mt-5 text-[1.15rem] font-semibold tracking-[0.06em] sm:text-[1.3rem]">{d.ref}</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className={cn("text-[0.65rem]", dark ? "text-[#121218]/60" : "text-white/75")}>Agreed value · {d.client}</p>
          <p className="money text-[1.25rem] font-bold">
            <span className="align-top text-[0.7rem]">$</span>
            {d.amount}
          </p>
        </div>
        <span className="money text-[0.8125rem] font-semibold">{d.date}</span>
      </div>
    </div>
  );
}

/**
 * Card-wall feature section: bright agreement cards on a tilted 3D plane. Columns slide in
 * opposite directions with scroll (parallax); cards lift on hover. Static under reduced motion.
 */
export function CardWallSection() {
  const section = useRef<HTMLElement>(null);
  const cols = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = section.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 when the section enters from below, +1 when it leaves at the top
      const p = Math.max(-1, Math.min(1, (vh / 2 - (r.top + r.height / 2)) / (vh / 2 + r.height / 2)));
      cols.current.forEach((c, i) => {
        if (c) c.style.transform = `translate3d(0, ${p * (i % 2 === 0 ? -140 : 140)}px, 0)`;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={section} className="px-4 py-16 sm:px-6">
      <div className="relative mx-auto grid min-h-[40rem] max-w-6xl overflow-hidden rounded-[2rem] bg-black lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)]">
        <div className="relative z-10 flex flex-col justify-center px-8 py-12 sm:px-12">
          <h2 className="text-[2.75rem] font-bold leading-[0.98] tracking-[-0.04em] text-white sm:text-[4rem]">
            Every promise, on one card.
          </h2>
          <ul className="mt-8 space-y-3 text-[1.0625rem] text-white/90 sm:text-[1.25rem]">
            {["Scope changes caught", "Proof checked by AI", "PayPal payments you approve"].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff8a1a]" aria-hidden /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-sm text-[0.9375rem] text-white/60">Each agreement keeps its scope, versions, milestones and PayPal payments together.</p>
          <Link href="/login" className="mt-8 inline-flex h-12 w-fit items-center rounded-full bg-white px-6 text-[0.9375rem] font-semibold text-black transition hover:bg-[#ffe7d1]">
            Try the demo workspace
          </Link>
        </div>

        {/* 3D card plane */}
        <div className="relative h-[34rem] [perspective:1400px] lg:h-auto" aria-hidden>
          <div className="absolute left-[2%] top-1/2 flex gap-6 [transform-style:preserve-3d] [transform:translateY(-50%)_rotateX(22deg)_rotateY(-14deg)_rotateZ(-9deg)]">
            {COLUMNS.map((col, i) => (
              <div
                key={i}
                ref={(n) => {
                  cols.current[i] = n;
                }}
                className="flex flex-col gap-6 transition-transform duration-100 ease-out [transform-style:preserve-3d]"
                style={{ marginTop: i === 1 ? "-5rem" : i === 2 ? "2rem" : "0" }}
              >
                {col.map((d) => (
                  <FinCard key={d.ref} d={d} />
                ))}
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black to-transparent max-lg:hidden" />
        </div>
      </div>
    </section>
  );
}
