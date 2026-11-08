import type React from "react";
import { CheckCheck, Handshake, Inbox, LayoutGrid, Radar, Users, Wallet } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

/**
 * Static preview of the PactPop dashboard for the landing page. Marketing illustration only:
 * the figures follow the demo scenario and are not live data.
 */
export function ProductMockup() {
  const nav = [
    { icon: LayoutGrid, label: "Dashboard", active: true },
    { icon: Handshake, label: "Commitments" },
    { icon: Users, label: "Clients" },
    { icon: Wallet, label: "Payments" },
    { icon: CheckCheck, label: "Approvals" },
  ];
  const statement = [
    ["Received", "$750.00", "1 PayPal payment"],
    ["Outstanding", "$1,050.00", "2 open invoices"],
    ["Under agreement", "$1,800.00", "1 commitment"],
    ["Approvals", "1", "Action needed"],
  ];
  const activity = [
    { icon: Wallet, t: "Deposit paid via PayPal", s: "Northwind Bakery · webhook verified", v: "$750.00", st: "Paid", tone: "text-[#4fbf87]" },
    { icon: Radar, t: "ScopeWatch: 3 extra pages", s: "Change order drafted", v: "$300.00", st: "Review", tone: "text-[#e0a33e]" },
    { icon: Handshake, t: "Agreement accepted", s: "Website redesign · 5 pages", v: "$1,500.00", st: "Signed", tone: "text-[#9a98a6]" },
    { icon: Inbox, t: "New request analysed", s: "Kitefly Tours · Intake Agent", v: "", st: "New", tone: "text-[#9a98a6]" },
  ];
  return (
    <div className="relative mx-auto max-w-5xl" role="img" aria-label="Preview of the PactPop dashboard">
      <div className="overflow-hidden rounded-[1.25rem] border border-[#2a2832] bg-[#0e0d12] text-left text-[#ecebf0] shadow-[var(--shadow-lift)]">
        {/* window bar */}
        <div className="flex items-center gap-1.5 border-b border-[#2a2832] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3743]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3743]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#3a3743]" />
          <span className="ml-3 flex items-center gap-1.5 font-mono text-[0.65rem] text-[#615f6c]">
            <LogoMark variant="mark" className="h-3.5 w-3.5" /> pactpop · Lumen Studio
          </span>
        </div>
        <div className="grid md:grid-cols-[11rem_1fr]">
          <div className="hidden flex-col gap-1 border-r border-[#2a2832] bg-[#17161d] p-3 md:flex">
            <div className="mb-3 flex items-center gap-2 px-1">
              <LogoMark className="h-6 w-6" />
              <span className="font-[family-name:var(--font-brand)] text-sm font-semibold">PactPop</span>
            </div>
            {nav.map(({ icon: Icon, label, active }) => (
              <div key={label} className={active ? "flex items-center gap-2 rounded-lg bg-white/[0.08] px-2.5 py-1.5 text-xs font-semibold" : "flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#9a98a6]"}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
            ))}
          </div>

          <div className="space-y-3 p-3 sm:p-4">
            <div className="overflow-hidden rounded-xl border border-[#2a2832] bg-[#17161d]">
              <div className="flex items-center gap-2 border-b border-[#2a2832] px-3 py-2">
                <span className="text-xs font-semibold">Statement</span>
                <span className="font-mono text-[0.6rem] text-[#615f6c]">Nov 7, 2026 · USD</span>
                <span className="ml-auto rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-[#9a98a6]">Sandbox</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4">
                {statement.map(([l, v, n], i) => (
                  <div key={l} className={`px-3 py-3 ${i % 2 === 1 ? "border-l border-[#2a2832]" : ""} ${i >= 2 ? "border-t border-[#2a2832] lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}>
                    <p className="text-[0.65rem] text-[#9a98a6]">{l}</p>
                    <p className="money mt-1.5 text-lg font-semibold tracking-tight">{v}</p>
                    <p className={`mt-1 text-[0.6rem] ${l === "Approvals" ? "text-[#e0a33e]" : "text-[#615f6c]"}`}>{n}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#2a2832] bg-[#17161d]">
              <p className="border-b border-[#2a2832] px-3 py-2 text-xs font-semibold">Recent activity</p>
              <ul className="divide-y divide-[#2a2832]">
                {activity.map(({ icon: Icon, t, s, v, st, tone }) => (
                  <li key={t} className="flex items-center gap-3 px-3 py-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-[#615f6c]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.72rem] font-medium">{t}</span>
                      <span className="block truncate text-[0.62rem] text-[#9a98a6]">{s}</span>
                    </span>
                    {v && <span className="money hidden text-[0.72rem] font-semibold sm:block">{v}</span>}
                    <span className={`w-12 text-right text-[0.62rem] font-medium ${tone}`}>{st}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* PayPal receipt stub */}
      <div
        className="stub tone-mint animate-float absolute -bottom-10 -right-2 hidden w-64 shadow-[var(--shadow-lift)] [--r:3deg] sm:block lg:-right-10"
        style={{ "--tear": "3rem", "--notch": "8px" } as React.CSSProperties}
      >
        <div className="flex h-12 items-center justify-between px-4">
          <span className="text-xs font-semibold">Payment received</span>
          <span className="font-mono text-[0.6rem] uppercase tracking-wider text-muted">PayPal</span>
        </div>
        <div className="space-y-1 px-4 pb-4 pt-3 text-[0.72rem]">
          <div className="flex justify-between">
            <span className="text-muted">Northwind Bakery</span>
            <span className="money font-semibold">$750.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Deposit · 50%</span>
            <span className="text-success">Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
