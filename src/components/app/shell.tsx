"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Bell, Building2, Check, ChevronDown, ChevronRight, Copy, CreditCard, Link2, LogOut, Moon, Search, Sparkles, UserRound } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ThemeToggle, toggleTheme } from "@/components/ui/theme";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";

type ShellProps = {
  children: ReactNode;
  user: { name: string; email: string };
  business: { name: string; isDemo: boolean };
  requestPath: string;
  pendingApprovals: number;
  logout: () => Promise<void>;
  integrations: { paypal: boolean; ai: boolean };
};

const READY = NAV_ITEMS.filter((i) => i.ready);

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#a18bff] to-[#5b3cd4] text-sm font-semibold text-white", className)} aria-hidden>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Copies the absolute client-request URL. */
export function useCopyRequestLink(requestPath: string) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${requestPath}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ tone: "success", title: "Request link copied", description: url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ tone: "error", title: "Couldn't copy the link", description: url });
    }
  };
  return { copy, copied };
}

/** The business's client request link. (Owner-approved design — keep as is.) */
export function RequestLinkCard({ requestPath }: { requestPath: string }) {
  const { copy, copied } = useCopyRequestLink(requestPath);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7b6dff] via-[#5b45e8] to-[#2f1aa6] p-4 text-white shadow-[0_16px_40px_-16px_rgb(108_92_255/0.8)]">
      <svg viewBox="0 0 120 50" className="pointer-events-none absolute -right-3 -top-1 h-16 w-36 opacity-25" aria-hidden>
        <path d="M8 40 C30 40 40 10 60 10 C80 10 90 40 112 40" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" />
        <circle cx="8" cy="40" r="6" fill="white" />
        <circle cx="112" cy="40" r="6" fill="white" />
      </svg>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 ring-1 ring-white/25">
        <Link2 className="h-[18px] w-[18px]" />
      </span>
      <p className="mt-3 text-sm font-semibold">Your request link</p>
      <p className="mt-0.5 truncate font-mono text-[0.7rem] text-white/70">{requestPath}</p>
      <button
        onClick={copy}
        className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-white/95 text-[0.8125rem] font-semibold text-[#3a1fb8] transition hover:bg-white"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

/** Floating sidebar (desktop): rounded panel, icon + label, gradient highlight on the active page. */
function Rail({ pendingApprovals, logout }: { pendingApprovals: number; logout: () => Promise<void> }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col p-3">
      <nav aria-label="App" className="flex flex-1 flex-col items-center rounded-[1.75rem] bg-surface/80 px-2 py-5 shadow-[0_20px_50px_-30px_rgb(20_10_60/0.45)] ring-1 ring-border backdrop-blur-xl">
        <Link href="/app/dashboard" aria-label="PactPop dashboard" className="mb-6">
          <LogoMark className="h-10 w-10" />
        </Link>
        <ul className="flex w-full flex-1 flex-col items-center gap-1.5">
          {READY.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href} className="w-full">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex w-full flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[0.625rem] font-semibold transition-all",
                    active ? "text-foreground" : "text-muted hover:bg-fill hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-xl transition-all",
                      active && "bg-gradient-to-br from-[#9b84ff] to-[#5a3df0] text-white shadow-[0_10px_24px_-10px_rgb(108_78_245/0.9)]",
                    )}
                  >
                    <Icon className="h-[19px] w-[19px]" strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                  <span className="max-w-full truncate leading-none">{label.replace("Command Center", "Agents")}</span>
                  {href === "/app/approvals" && pendingApprovals > 0 && (
                    <span className="absolute right-2 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[0.6rem] font-bold text-white">{pendingApprovals}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <form action={logout} className="w-full">
          <button className="flex w-full flex-col items-center gap-1 rounded-2xl py-2 text-[0.625rem] font-semibold text-muted transition-colors hover:bg-error-soft hover:text-error" aria-label="Log out">
            <LogOut className="h-[19px] w-[19px]" strokeWidth={1.8} />
            Log out
          </button>
        </form>
      </nav>
    </div>
  );
}

/** Top bar: centred search (clients), theme, approvals bell, account menu. */
function TopBar({ user, pendingApprovals, onAccount }: { user: ShellProps["user"]; pendingApprovals: number; onAccount: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    router.push(term ? `/app/clients?q=${encodeURIComponent(term)}` : "/app/clients");
  };
  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/app/dashboard" aria-label="Dashboard" className="lg:hidden">
          <Logo size="sm" />
        </Link>
        <form onSubmit={submit} role="search" className="relative mx-auto hidden w-full max-w-sm sm:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
            aria-label="Search clients"
            className="h-10 w-full rounded-full border border-transparent bg-surface pl-11 pr-4 text-[0.875rem] placeholder:text-muted focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-ring/40"
          />
        </form>
        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <ThemeToggle className="text-muted" />
          <Link href="/app/approvals" aria-label={`Approvals${pendingApprovals ? `, ${pendingApprovals} waiting` : ""}`} className="relative grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-surface hover:text-foreground">
            <Bell className="h-[18px] w-[18px]" />
            {pendingApprovals > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-error ring-2 ring-background" aria-hidden />}
          </Link>
          <button onClick={onAccount} className="ml-1 flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition-colors hover:bg-surface" aria-label="Account menu">
            <Avatar name={user.name} />
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>
        </div>
      </div>
    </header>
  );
}

/** iOS-style grouped list: one raised card, hairline dividers between rows. */
function SheetGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "divide-y divide-border overflow-hidden rounded-2xl bg-surface-2 shadow-[0_1px_0_rgb(255_255_255/0.04)_inset,0_12px_28px_-16px_rgb(0_0_0/0.55)] ring-1 ring-border",
        className,
      )}
    >
      {children}
    </div>
  );
}

type SheetRowProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: ReactNode;
  trailing?: ReactNode;
  status?: boolean;
} & ({ as?: "div" } | { as: "button"; onClick: () => void } | { as: "link"; href: string; onClick?: () => void });

function SheetRow(props: SheetRowProps) {
  const { icon: Icon, label, value, trailing, status } = props;
  const body = (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.6rem] bg-fill">
        <Icon className="h-4 w-4 text-foreground/75" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium">{label}</span>
      {value != null && (
        <span className="flex min-w-0 items-center gap-1.5 truncate text-[0.875rem] text-muted">
          {status !== undefined && <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", status ? "bg-money-in" : "bg-muted/50")} aria-hidden />}
          {value}
        </span>
      )}
      {trailing ?? (props.as === "button" || props.as === "link" ? <ChevronRight className="h-4 w-4 shrink-0 text-muted/70" /> : null)}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-3.5 py-2.5 text-left";
  if (props.as === "button")
    return (
      <button type="button" onClick={props.onClick} className={cn(cls, "transition-colors hover:bg-fill")}>
        {body}
      </button>
    );
  if (props.as === "link")
    return (
      <Link href={props.href} onClick={props.onClick} className={cn(cls, "transition-colors hover:bg-fill")}>
        {body}
      </Link>
    );
  return <div className={cls}>{body}</div>;
}

/** Account sheet: profile, workspace, request link, more pages, appearance, integrations, logout. */
function AccountSheet({ open, onClose, ...p }: Omit<ShellProps, "children" | "pendingApprovals"> & { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { copy, copied } = useCopyRequestLink(p.requestPath);
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
      className="mx-auto mb-0 mt-auto w-full max-w-md rounded-t-[1.75rem] bg-surface p-0 text-foreground shadow-[0_40px_100px_-30px_rgb(0_0_0/0.6)] ring-1 ring-border sm:mb-auto sm:rounded-[1.75rem]"
    >
      <div className="pb-safe p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[1.25rem] font-semibold tracking-[-0.02em]">Account</h2>
          <button onClick={onClose} className="h-8 rounded-full bg-fill px-3.5 text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-fill-strong">
            Done
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3.5 px-1">
          <Avatar name={p.user.name} className="h-14 w-14 text-xl shadow-[0_8px_20px_-8px_rgb(0_0_0/0.5)]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.0625rem] font-semibold tracking-[-0.01em]">{p.user.name}</p>
            <p className="truncate text-[0.875rem] text-muted">{p.user.email}</p>
          </div>
        </div>

        <SheetGroup className="mt-5">
          <SheetRow icon={Building2} label="Workspace" value={`${p.business.name}${p.business.isDemo ? " · Demo" : ""}`} />
          <SheetRow as="button" onClick={copy} icon={Link2} label="Request link" value={copied ? "Copied" : "Copy"} trailing={copied ? <Check className="h-4 w-4 text-muted" /> : <Copy className="h-4 w-4 text-muted" />} />
          <SheetRow
            as="button"
            onClick={toggleTheme}
            icon={Moon}
            label="Appearance"
            value={
              <>
                <span className="dark:hidden">Light</span>
                <span className="hidden dark:inline">Dark</span>
              </>
            }
          />
        </SheetGroup>

        <nav aria-label="All pages" className="lg:hidden">
          <SheetGroup className="mt-3">
            {READY.map(({ href, label, icon }) => (
              <SheetRow key={href} as="link" href={href} onClick={onClose} icon={icon} label={label} />
            ))}
          </SheetGroup>
        </nav>

        <p className="mt-5 px-1 text-[0.75rem] font-medium text-muted">Connections</p>
        <SheetGroup className="mt-2">
          <SheetRow icon={CreditCard} label="PayPal Sandbox" value={p.integrations.paypal ? "Connected" : "Not set up"} status={p.integrations.paypal} />
          <SheetRow icon={Sparkles} label="AI agents" value={p.integrations.ai ? "Online" : "Rule-based"} status={p.integrations.ai} />
        </SheetGroup>

        <form action={p.logout} className="mt-5">
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-surface-2 text-[0.9375rem] font-medium text-foreground shadow-[0_1px_0_rgb(255_255_255/0.04)_inset,0_10px_24px_-14px_rgb(0_0_0/0.5)] ring-1 ring-border transition-colors hover:bg-fill">
            <LogOut className="h-4 w-4 text-muted" /> Log out
          </button>
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
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 pt-2 text-[0.6875rem] font-medium", active ? "text-accent" : "text-muted")}>
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
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

export function AppShell({ children, ...props }: ShellProps) {
  const [sheet, setSheet] = useState(false);
  return (
    <div className="app-backdrop min-h-screen lg:grid lg:grid-cols-[120px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Rail pendingApprovals={props.pendingApprovals} logout={props.logout} />
        </div>
      </aside>
      <div className="min-w-0">
        <TopBar user={props.user} pendingApprovals={props.pendingApprovals} onAccount={() => setSheet(true)} />
        <main className="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-2 sm:px-6 lg:px-8 lg:pb-12">{children}</main>
      </div>
      <TabBar onAccount={() => setSheet(true)} pendingApprovals={props.pendingApprovals} />
      <AccountSheet open={sheet} onClose={() => setSheet(false)} {...props} />
    </div>
  );
}
