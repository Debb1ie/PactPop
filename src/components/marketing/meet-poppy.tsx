import Image from "next/image";
import { Mascot, type MascotMood } from "@/components/brand/mascot";

const MOODS: { mood: MascotMood; title: string; text: string }[] = [
  { mood: "thinking", title: "Sniffs out scope creep", text: "ScopeWatch spots extra asks before you do the work." },
  { mood: "thumbs-up", title: "Waits for your OK", text: "Nothing that moves money happens without you." },
  { mood: "party", title: "Cheers on payday", text: "Celebrates when PayPal confirms a payment." },
  { mood: "sleeping", title: "Rests when all is paid", text: "No chasing, no reminders, nothing overdue." },
];

/** Landing section introducing Poppy, PactPop's mascot. */
export function MeetPoppy() {
  return (
    <section className="py-20 sm:py-28" aria-labelledby="meet-poppy">
      <div className="pp-reveal mx-auto grid max-w-6xl items-center gap-10 px-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgb(124_92_255/0.25),transparent_65%)] blur-2xl" aria-hidden />
          <Image src="/mascot/hero.webp" alt="Poppy, the PactPop pup, holding a PactPop card and winking" width={1200} height={800} className="relative h-auto w-full" />
        </div>
        <div>
          <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-[#6c4ef5]">Meet Poppy</p>
          <h2 id="meet-poppy" className="mt-3 text-balance text-[2.25rem] font-medium leading-[1.06] tracking-[-0.04em] text-[#0d0d10] sm:text-[3rem]">
            A loyal pup for every promise you make.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[1.0625rem] leading-relaxed text-[#62626e]">
            Poppy is PactPop&apos;s mascot. Like a good dog, Poppy keeps watch over your agreements, fetches your PayPal payments, and never lets money move until you say so.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {MOODS.map((m) => (
              <li key={m.mood} className="group flex items-center gap-3 rounded-[1.25rem] bg-white p-3 shadow-[0_16px_34px_-24px_rgb(30_20_80/0.45)] transition-transform duration-500 ease-[var(--ease-ios)] hover:-translate-y-1">
                <Mascot mood={m.mood} width={64} decorative className="shrink-0 transition-transform duration-500 ease-[var(--ease-ios)] group-hover:-rotate-6 group-hover:scale-110" />
                <span className="min-w-0">
                  <span className="block text-[0.875rem] font-semibold text-[#0d0d10]">{m.title}</span>
                  <span className="block text-[0.75rem] leading-snug text-[#0d0d10]/55">{m.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
