import Link from "next/link";
import { ScrollGrid } from "@/components/fx/scroll-grid";
import { LogoMark } from "@/components/brand/logo";
import { SectionNav } from "@/components/marketing/section-nav";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
];

/** Marketing pages: always light, bright landing look. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="force-light relative isolate flex min-h-screen flex-col">
      <ScrollGrid forceLight />
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:h-20 sm:gap-3 sm:px-6">
          <Link href="/" aria-label="PactPop home" className="flex items-center gap-4 justify-self-start">
            <span className="flex items-center gap-2.5">
              <LogoMark variant="mark" className="h-7 w-7 sm:h-8 sm:w-8" />
              <span className="font-[family-name:var(--font-brand)] text-[1.1rem] font-semibold uppercase tracking-[0.04em] text-[#0d0d10] sm:text-[1.35rem]">PactPop</span>
            </span>
          </Link>
          <SectionNav />
          <div className="flex items-center gap-1 justify-self-end">
          <Link href="/login" className="hidden rounded-xl px-3 py-2.5 text-[0.875rem] font-medium text-[#3a3a42] hover:bg-[#f2f2f5] sm:inline-flex">
            Log in
          </Link>
          <Link
            href="/register"
            className="whitespace-nowrap rounded-xl bg-[#0d0d10] px-3 py-2.5 text-[0.875rem] font-medium text-white transition hover:bg-[#2a2a30] sm:px-5"
          >
            <span className="sm:hidden">Sign up</span>
            <span className="hidden sm:inline">Create account</span>
          </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-[#0b0b0e] text-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <span className="flex items-center gap-2.5">
              <LogoMark variant="mark" className="h-8 w-8" />
              <span className="font-[family-name:var(--font-brand)] text-[1.35rem] font-semibold uppercase tracking-[0.04em]">PactPop</span>
            </span>
            <p className="mt-2 text-sm text-white/55">Make promises. Make progress. Get paid.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="transition-colors hover:text-white">
                {n.label}
              </Link>
            ))}
            <Link href="/login" className="transition-colors hover:text-white">
              Log in
            </Link>
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-white/40 sm:px-6">
          Built for the PayPal AI Hackathon. PayPal is a trademark of PayPal, Inc. PactPop is not affiliated with or endorsed by PayPal.
        </p>
      </footer>
    </div>
  );
}
