"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Crown, LogOut, Moon, Plus, Search, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle, toggleTheme } from "@/components/ui/theme";
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

const READY = NAV_ITEMS.filter((i) => i.ready);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#9d8fff] to-[#4f3fe6] text-sm font-semibold text-white", className)} aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn("h-2 w-2 rounded-full", ok ? "bg-success shadow-[0_0_8px_var(--pp-success)]" : "bg-warning")} aria-hidden />
      {label}
    </li>
  );
}

function Integrations({ integrations }: { integrations: ShellProps["integrations"] }) {
  return (
    <ul className="space-y-1.5 text-xs text-muted">
      <StatusDot ok={integrations.paypal} label={integrations.paypal ? "PayPal Sandbox connected" : "PayPal not configured"} />
      <StatusDot ok={integrations.ai} label={integrations.ai ? "AI agents online" : "AI in rule-based mode"} />
    </ul>
  );
}

/** Purple upgrade card (Starter) or trial status (paid plans). */
function PlanCard({ plan }: { plan: ShellProps["plan"] }) {
  if (plan.paid) {
    return (
      <div className="rounded-2xl border border-border bg-surface-2 px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Crown className="h-4 w-4 text-[#ffc94d]" /> {plan.name} plan
        </p>
        <p className="mt-0.5 text-xs text-muted">{plan.trialDaysLeft != null ? `Free trial · ${plan.trialDaysLeft} day${plan.trialDaysLeft === 1 ? "" : "s"} left` : "Active"}</p>
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7b6dff] via-[#5b45e8] to-[#3a1fb8] p-4 text-white shadow-[0_16px_40px_-16px_rgb(108_92_255/0.8)]">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-xl" />
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#ffe08a] to-[#f5a524] text-[#5a3a00] shadow-lg">
        <Crown className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold">Unlock unlimited commitments</p>
      <p className="mt-0.5 text-xs text-white/70">ScopeWatch change orders, ProofFlow and more.</p>
      <Link
        href="/pricing"
        className="mt-3 flex h-9 items-center justify-center gap-1.5 rounded-xl bg-white text-[0.8125rem] font-semibold text-[#3a1fb8] transition hover:bg-[#f1efff]"
      >
        <Crown className="h-3.5 w-3.5" /> Upgrade to Pro
      </Link>
    </div>
  );
}

function Sidebar({ business, pendingApprovals, plan, logout, integrations }: Omit<ShellProps, "children" | "user">) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col gap-5 border-r border-border bg-surface/60 px-4 py-5 backdrop-blur-xl dark:bg-[#0b0b10]/80">
      <Link href="/app/dashboard" aria-label="Dashboard" className="px-1">
        <Logo size="sm" />
      </Link>

      <div className="flex items-center gap-2 px-1 text-[0.8125rem] text-muted">
        <span className="truncate font-medium text-foreground">{business.name}</span>
        {business.isDemo && <DemoBadge />}
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto" aria-label="App">
        {NAV_GROUPS.map((g) => {
          const items = READY.filter((i) => i.group === g.key);
          if (!items.length) return null;
          return (
            <ul key={g.key} className="space-y-1.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[0.9375rem] transition-all",
                        active
                          ? "border-transparent bg-gradient-to-r from-white to-[#d9d4ff] font-semibold text-[#111118] shadow-[0_8px_24px_-12px_rgb(108_92_255/0.7)]"
                          : "border-border bg-fill text-muted hover:bg-fill-strong hover:text-foreground",
                      )}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1">{label}</span>
                      {href === "/app/approvals" && pendingApprovals > 0 && (
                        <span className="money rounded-full bg-error px-1.5 text-xs font-semibold text-white">{pendingApprovals}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          );
        })}
      </nav>

      <PlanCard plan={plan} />
      <div className="px-1">
        <Integrations integrations={integrations} />
      </div>
      <form action={logout}>
        <button className="flex w-full items-center gap-3 rounded-xl border border-border bg-fill px-3.5 py-2.5 text-[0.9375rem] text-muted transition-colors hover:text-error">
          <LogOut className="h-[18px] w-[18px] text-error" /> Log out
        </button>
      </form>
    </div>
  );
}

/** Top bar: client search (works), quick add, theme, and the user menu. */
function TopBar({ user, onAccount }: { user: ShellProps["user"]; onAccount: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/app/clients?q=${encodeURIComponent(term)}` : "/app/clients");
  };
  return (
    <header className="glass sticky top-0 z-30 border-b border-border">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/app/dashboard" aria-label="Dashboard" className="lg:hidden">
          <Logo size="sm" />
        </Link>
        <form onSubmit={submit} role="search" className="relative hidden flex-1 sm:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search clients, companies or emails…"
            aria-label="Search clients"
            className="h-11 w-full max-w-xl rounded-2xl border border-border bg-surface pl-11 pr-4 text-[0.9375rem] placeholder:text-faint focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-ring/40"
          />
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/app/clients/new"
            aria-label="Add client"
            className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <Plus className="h-[18px] w-[18px]" />
          </Link>
          <ThemeToggle boxed />
          <button
            onClick={onAccount}
            className="flex h-11 items-center gap-2 rounded-2xl border border-border bg-surface py-1 pl-1 pr-2 transition-colors hover:bg-surface-2 sm:pr-3"
            aria-label="Account menu"
          >
            <Avatar name={user.name} />
            <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
            <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
}

/** Account sheet (all sizes): profile, plan, appearance, integrations, logout. */
function AccountSheet({ open, onClose, ...p }: Omit<ShellProps, "children" | "pendingApprovals"> & { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label="Account"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className="mx-auto mb-0 mt-auto w-full max-w-md rounded-t-[1.75rem] border border-border bg-surface p-0 text-foreground sm:mb-auto sm:rounded-[1.75rem]"
    >
      <div className="pb-safe p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Account</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-sm font-semibold text-accent hover:bg-fill">
            Done
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <Avatar name={p.user.name} className="h-12 w-12 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{p.user.name}</p>
            <p className="truncate text-sm text-muted">{p.user.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 truncate font-medium">
            {p.business.name} {p.business.isDemo && <DemoBadge />}
          </span>
          {p.plan.paid ? (
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-semibold text-accent">
              {p.plan.name}
              {p.plan.trialDaysLeft != null && ` · ${p.plan.trialDaysLeft}d trial`}
            </span>
          ) : (
            <Link href="/pricing" className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-white">
              Upgrade
            </Link>
          )}
        </div>
        <button onClick={toggleTheme} className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-left text-sm">
          <Moon className="h-4 w-4 text-accent" />
          <span className="flex-1 font-medium">Appearance</span>
          <span className="text-muted">
            <span className="dark:hidden">Light</span>
            <span className="hidden dark:inline">Dark</span>
          </span>
        </button>
        <div className="mt-3 rounded-2xl border border-border bg-surface-2 px-4 py-3">
          <Integrations integrations={p.integrations} />
        </div>
        <form action={p.logout} className="mt-4">
          <button className="h-12 w-full rounded-2xl border border-error/30 bg-error-soft text-base font-semibold text-error">Log out</button>
        </form>
      </div>
    </dialog>
  );
}

/** Bottom tab bar (mobile / tablet). */
function TabBar({ onAccount, pendingApprovals }: { onAccount: () => void; pendingApprovals: number }) {
  const pathname = usePathname();
  return (
    <nav className="glass pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border lg:hidden" aria-label="Tabs">
      <ul className="mx-auto flex max-w-xl">
        {READY.slice(0, 4).map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-0.5 pt-2 text-[0.6875rem] font-medium", active ? "text-accent" : "text-muted")}
              >
                <span className="relative">
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.3 : 1.8} />
                  {href === "/app/approvals" && pendingApprovals > 0 && (
                    <span className="absolute -right-2 -top-1 rounded-full bg-error px-1 text-[0.625rem] font-semibold text-white">{pendingApprovals}</span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button onClick={onAccount} className="flex w-full flex-col items-center gap-0.5 pt-2 text-[0.6875rem] font-medium text-muted">
            <UserRound className="h-6 w-6" strokeWidth={1.8} />
            Account
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AppShell({ children, ...props }: ShellProps) {
  const [sheet, setSheet] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar {...props} />
        </div>
      </aside>
      <div className="min-w-0">
        <TopBar user={props.user} onAccount={() => setSheet(true)} />
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>
      <TabBar onAccount={() => setSheet(true)} pendingApprovals={props.pendingApprovals} />
      <AccountSheet open={sheet} onClose={() => setSheet(false)} {...props} />
    </div>
  );
}
