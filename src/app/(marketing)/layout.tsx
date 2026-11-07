import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme";
import { ScrollGrid } from "@/components/fx/scroll-grid";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
];

export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-screen flex-col">
      <ScrollGrid />
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6">
        <div className="glass mx-auto flex h-14 max-w-6xl items-center gap-6 rounded-2xl border border-border px-3 shadow-[var(--shadow-card)] sm:px-4">
          <Link href="/" aria-label="PactPop home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-fill hover:text-foreground">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
              Log in
            </ButtonLink>
            <ButtonLink href="/register" size="sm">
              Get Started
            </ButtonLink>
          </div>
        </div>
        <nav className="mx-auto mt-2 flex max-w-6xl gap-1 overflow-x-auto md:hidden" aria-label="Main mobile">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="glass shrink-0 rounded-xl border border-border px-3 py-1.5 text-sm text-muted hover:bg-fill">
              {n.label}
            </Link>
          ))}
          <Link href="/login" className="glass shrink-0 rounded-xl border border-border px-3 py-1.5 text-sm text-muted hover:bg-fill sm:hidden">
            Log in
          </Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-border p-3 md:hidden">
        <ButtonLink href="/register" className="w-full" size="lg">
          Get Started
        </ButtonLink>
      </div>
      <footer className="border-t border-border pb-20 md:pb-0">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted">Make promises. Make progress. Get paid.</p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-foreground">
                {n.label}
              </Link>
            ))}
            <Link href="/login" className="hover:text-foreground">
              Log in
            </Link>
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted sm:px-6">
          Built for the PayPal AI Hackathon. PayPal is a trademark of PayPal, Inc. PactPop is not affiliated with or endorsed by PayPal.
        </p>
      </footer>
    </div>
  );
}
