"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/ui/theme";
import { DemoBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { NAV_GROUPS, NAV_ITEMS } from "./nav";

type ShellProps = {
  children: ReactNode;
  user: { name: string; email: string };
  business: { name: string; isDemo: boolean };
  pendingApprovals: number;
  plan: { name: string; paid: boolean; trialDaysLeft: number | null };
  logout: () => Promise<void>;
  integrations: { paypal: boolean; ai: boolean };
};

function NavLinks({ pendingApprovals, onNavigate }: { pendingApprovals: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6" aria-label="App">
      {NAV_GROUPS.map((g) => {
        const items = NAV_ITEMS.filter((i) => i.group === g.key && i.ready);
        if (!items.length) return null;
        return (
          <div key={g.key}>
            <p className="px-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted/80">{g.label}</p>
            <ul className="mt-2 space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                        active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-surface-2 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1">{label}</span>
                      {href === "/app/approvals" && pendingApprovals > 0 && (
                        <span className="money rounded-full bg-warning px-1.5 text-[0.7rem] font-semibold text-white">{pendingApprovals}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function StatusRow({ ok, label, off }: { ok: boolean; label: string; off: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", ok ? "bg-success" : "bg-warning")} aria-hidden />
      <span>{ok ? label : off}</span>
    </li>
  );
}

function IntegrationStatus({ integrations }: { integrations: ShellProps["integrations"] }) {
  return (
    <ul className="space-y-1.5 rounded-xl border border-border bg-surface-2/70 px-3 py-2.5 text-xs text-muted">
      <StatusRow ok={integrations.paypal} label="PayPal Sandbox connected" off="PayPal not configured" />
      <StatusRow ok={integrations.ai} label="AI agents online" off="AI in rule-based mode" />
    </ul>
  );
}

function PlanBadge({ plan }: { plan: ShellProps["plan"] }) {
  if (!plan.paid) {
    return (
      <Link href="/pricing" className="mt-2 flex items-center justify-between rounded-lg bg-accent-soft px-2 py-1 text-xs text-accent hover:brightness-95">
        <span>Starter plan</span>
        <span className="font-semibold">Upgrade →</span>
      </Link>
    );
  }
  return (
    <p className="mt-2 flex items-center justify-between rounded-lg bg-accent-soft px-2 py-1 text-xs text-accent">
      <span className="font-semibold">{plan.name}</span>
      <span>{plan.trialDaysLeft != null ? `Trial · ${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? "" : "s"} left` : "Active"}</span>
    </p>
  );
}

export function AppShell({ children, user, business, pendingApprovals, plan, logout, integrations }: ShellProps) {
  const [open, setOpen] = useState(false);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <div className="flex items-center justify-between px-2">
        <Link href="/app/dashboard" aria-label="Dashboard">
          <Logo />
        </Link>
      </div>
      <div className="mx-2 rounded-xl border border-border bg-surface px-3 py-2.5">
        <p className="text-[0.7rem] uppercase tracking-wide text-muted">Workspace</p>
        <p className="mt-0.5 flex items-center gap-2 truncate text-sm font-semibold">
          {business.name} {business.isDemo && <DemoBadge />}
        </p>
        <PlanBadge plan={plan} />
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks pendingApprovals={pendingApprovals} onNavigate={() => setOpen(false)} />
      </div>
      <div className="space-y-3 px-1">
        <IntegrationStatus integrations={integrations} />
        <div className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-aubergine font-display text-sm font-semibold text-lavender" aria-hidden>
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <form action={logout}>
            <button className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface-2 hover:text-foreground" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-surface/70 lg:block">{sidebar}</aside>

      {/* mobile / tablet drawer */}
      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-aubergine/50 backdrop-blur-sm transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-[17rem] max-w-[85vw] border-r border-border bg-background shadow-[var(--shadow-lift)] transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button className="absolute right-3 top-5 grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface-2" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
          {sidebar}
        </aside>
      </div>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6 lg:justify-end">
          <button className="grid h-9 w-9 place-items-center rounded-xl text-muted hover:bg-surface-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/app/dashboard" className="lg:hidden" aria-label="Dashboard">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
