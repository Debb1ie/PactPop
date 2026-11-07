import { CheckCheck, CircleDollarSign, Crown, Handshake, Inbox, LayoutGrid, Radar, Users, Wallet } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

/**
 * Static preview of the PactPop dashboard for the landing page (marketing illustration — the
 * figures follow the demo scenario and are not live data).
 */
export function ProductMockup() {
  const nav = [
    { icon: LayoutGrid, label: "Dashboard", active: true },
    { icon: Handshake, label: "Commitments" },
    { icon: Users, label: "Clients" },
    { icon: Wallet, label: "Payments" },
    { icon: CheckCheck, label: "Approvals" },
  ];
  const activity = [
    { icon: Wallet, bg: "bg-[#22c55e]", t: "Deposit paid via PayPal", s: "Northwind Bakery · verified webhook", v: "+$750.00", tone: "text-[#4ade80]", st: "Paid" },
    { icon: Radar, bg: "bg-[#f59e0b]", t: "ScopeWatch: 3 extra pages", s: "Change order drafted", v: "$300.00", tone: "text-white", st: "Review" },
    { icon: Handshake, bg: "bg-[#7b6dff]", t: "Proposal accepted", s: "Website redesign · 5 pages", v: "$1,500.00", tone: "text-white", st: "Signed" },
    { icon: Inbox, bg: "bg-[#3b82f6]", t: "New request analysed", s: "Kitefly Tours · Intake Agent", v: "—", tone: "text-white/60", st: "New" },
  ];
  return (
    <div className="relative mx-auto max-w-5xl" role="img" aria-label="Preview of the PactPop dashboard">
      <div className="absolute -inset-10 -z-10 rounded-[3rem] bg-[radial-gradient(closest-side,rgb(108_92_255/0.45),transparent)] blur-2xl" />
      <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a0a0f] p-2.5 text-left text-white shadow-[0_40px_120px_-30px_rgb(70_50_200/0.7)] sm:p-3">
        <div className="grid gap-3 md:grid-cols-[11rem_1fr]">
          {/* sidebar */}
          <div className="hidden flex-col gap-2 rounded-2xl p-2 md:flex">
            <div className="mb-2 flex items-center gap-2 px-1">
              <LogoMark className="h-7 w-7" />
              <span className="font-[family-name:var(--font-brand)] text-sm font-semibold">PactPop</span>
            </div>
            {nav.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={
                  active
                    ? "flex items-center gap-2 rounded-xl bg-gradient-to-r from-white to-[#d9d4ff] px-3 py-2 text-xs font-semibold text-[#111118]"
                    : "flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs text-white/60"
                }
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </div>
            ))}
          </div>

          {/* main */}
          <div className="space-y-3 p-1">
            <div className="flex items-center gap-2">
              <div className="h-9 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/35">Search clients, commitments…</div>
              <div className="flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-2 text-xs">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-[#9d8fff] to-[#4f3fe6] text-[0.65rem] font-semibold">M</span>
                <span className="hidden sm:inline">Maya Santos</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {[
                ["Received", "$750", "glow-violet"],
                ["Outstanding", "$1,050", "glow-peach"],
                ["Under agreement", "$1,800", "glow-pink"],
                ["Approvals", "1", "glow-ice"],
              ].map(([l, v, g]) => (
                <div key={l} className={`glow-card rounded-2xl p-3 ${g}`}>
                  <p className="text-[0.7rem] font-semibold">{l}</p>
                  <p className="money mt-4 text-xl font-semibold tracking-tight">{v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold">Recent activity</p>
                <span className="rounded-full border border-white/15 px-2 py-0.5 text-[0.65rem]">See all</span>
              </div>
              <ul className="space-y-1">
                {activity.map(({ icon: Icon, bg, t, s, v, tone, st }) => (
                  <li key={t} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 even:bg-white/[0.02]">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${bg}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.72rem] font-medium">{t}</span>
                      <span className="block truncate text-[0.65rem] text-white/45">{s}</span>
                    </span>
                    <span className={`money hidden text-[0.72rem] font-semibold sm:block ${tone}`}>{v}</span>
                    <span className="w-12 text-right text-[0.65rem] text-white/60">{st}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* floating cards */}
      <div className="animate-float absolute -bottom-8 -left-2 hidden w-56 rounded-3xl bg-gradient-to-br from-[#7b6dff] via-[#5b45e8] to-[#3a1fb8] p-4 text-white shadow-[0_30px_60px_-20px_rgb(60_40_200/0.8)] ring-1 ring-white/20 [--r:-6deg] sm:block lg:-left-14">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-[#ffe08a] to-[#f5a524] text-[#5a3a00]">
          <Crown className="h-5 w-5" />
        </span>
        <p className="mt-3 text-sm font-semibold">Change order approved</p>
        <p className="text-xs text-white/70">+$300.00 added to the agreement</p>
      </div>
      <div className="animate-float absolute -right-2 -top-6 hidden w-60 rounded-3xl border border-white/15 bg-white/10 p-4 text-white shadow-[0_30px_60px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl [--r:4deg] [animation-delay:-3s] sm:block lg:-right-12">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#22c55e]">
            <CircleDollarSign className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Deposit received</p>
            <p className="text-xs text-white/70">$750.00 · confirmed by PayPal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
