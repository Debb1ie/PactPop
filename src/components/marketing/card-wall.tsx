import Link from "next/link";
import { BadgeCheck, Radar, ShieldCheck } from "lucide-react";

const ARTS = ["card-art-arcs", "card-art-plum", "card-art-midnight", "card-art-sage", "card-art-ember", "card-art-ice", "card-art-orchid", "card-art-lime"];
const CLIENTS = ["Northwind Bakery", "Becker Legal", "Kitefly Tours", "Sora Ceramics", "Lumen Studio", "Atlas Dental", "Juniper Yoga", "Harbor & Co"];

/** One decorative agreement card for the wall. */
function WallCard({ i }: { i: number }) {
  const ref = String(1000 + ((i * 2731) % 9000));
  return (
    <div
      className={`group relative aspect-[1.586] w-[19rem] shrink-0 overflow-hidden rounded-[1.2rem] text-white shadow-[0_30px_60px_-30px_rgb(0_0_0/0.9)] ring-1 ring-white/10 transition-transform duration-500 ease-[var(--ease-ios)] hover:-translate-y-3 hover:scale-[1.04] ${ARTS[i % ARTS.length]}`}
    >
      <span className="absolute left-5 top-4 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white/70">PactPop</span>
      <svg viewBox="0 0 24 24" className="absolute right-5 top-4 h-5 w-5 text-white/70" aria-hidden>
        <path d="M8 7c2 2 2 8 0 10M12 5c3 3 3 11 0 14M16 3c4 4 4 14 0 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="absolute right-6 top-[38%] h-7 w-10 rounded-md border border-white/30 bg-white/10" />
      <span className="money absolute bottom-12 left-5 text-[1.05rem] tracking-[0.18em]">•••• •••• {ref}</span>
      <span className="absolute bottom-5 left-5 text-[0.75rem] text-white/80">{CLIENTS[i % CLIENTS.length]}</span>
      <span className="money absolute bottom-5 right-5 text-[0.7rem] text-white/70">v{(i % 3) + 1}</span>
    </div>
  );
}

/**
 * "Card wall" feature section: a dark field of tilted agreement cards drifting diagonally and
 * fading out, with the headline and key features on top.
 */
export function CardWallSection() {
  const rows = Array.from({ length: 5 }, (_, r) => Array.from({ length: 6 }, (_, c) => r * 6 + c));
  return (
    <section className="px-4 py-16 sm:px-6">
      <div className="relative mx-auto min-h-[34rem] max-w-6xl overflow-hidden rounded-[2rem] bg-[#0d0d10] sm:min-h-[38rem]">
        {/* card field */}
        <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(105deg,black_15%,rgb(0_0_0/0.75)_45%,transparent_78%)]" aria-hidden>
          <div className="card-wall-track pointer-events-auto absolute -left-[20%] -top-[45%] flex rotate-[-36deg] flex-col gap-6">
            {rows.map((row, r) => (
              <div key={r} className="flex gap-6" style={{ marginLeft: `${(r % 2) * 10}rem` }}>
                {row.map((i) => (
                  <WallCard key={i} i={i} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* copy */}
        <div className="relative ml-auto flex min-h-[34rem] max-w-xl flex-col justify-end px-6 pb-12 pt-[18rem] text-right sm:min-h-[38rem] sm:px-12 sm:pb-16 sm:pt-0">
          <h2 className="text-[2.5rem] font-bold leading-[1.02] tracking-[-0.04em] text-white sm:text-[4rem]">Every promise, on one card.</h2>
          <ul className="mt-6 flex flex-wrap justify-end gap-x-6 gap-y-3 text-[1rem] text-white/90 sm:text-[1.125rem]">
            <li className="flex items-center gap-2">
              <Radar className="h-5 w-5 text-[#d7ee6e]" /> Scope changes caught
            </li>
            <li className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-[#b9a5ff]" /> Proof checked
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#f6c89f]" /> You approve the money
            </li>
          </ul>
          <p className="mt-5 text-[0.9375rem] text-white/60">Each agreement keeps its scope, versions, milestones and PayPal payments together.</p>
          <div className="mt-8 flex justify-end">
            <Link href="/login" className="inline-flex h-14 items-center rounded-full border-2 border-white px-8 text-[1.0625rem] font-semibold text-white transition hover:bg-white hover:text-[#0d0d10]">
              Try the demo workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
