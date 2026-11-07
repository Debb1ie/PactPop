import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { formatMoney } from "@/lib/money";
import { PLANS } from "@/lib/plans";
import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = { title: "Create your workspace" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = await searchParams;
  const plan = PLANS.find((p) => p.id === sp.plan) ?? PLANS[0];
  const paid = plan.monthlyMinor > 0;
  return (
    <>
      <div className="text-center">
        <LogoMark className="mx-auto h-[4.5rem] w-[4.5rem] drop-shadow-[0_12px_24px_rgb(118_86_232/0.35)]" />
        <h1 className="mt-5 text-[1.75rem] font-bold">Create your workspace</h1>
        <p className="mt-1 text-[0.9375rem] text-muted">You&apos;ll get a client request link straight away.</p>
      </div>

      <div className="mt-6 rounded-2xl bg-surface p-4 shadow-[var(--shadow-card)] dark:shadow-none">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">
            {plan.name} <span className="font-normal text-muted">{paid ? "· 14-day free trial" : "· free forever"}</span>
          </p>
          <Link href="/pricing" className="text-[0.8125rem] font-semibold text-accent hover:opacity-70">
            Change
          </Link>
        </div>
        <ul className="mt-2 grid gap-1 text-[0.8125rem] text-muted sm:grid-cols-2">
          {plan.highlights.slice(0, 4).map((h) => (
            <li key={h} className="flex gap-1.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> {h}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted">
          No card required.{paid && ` Then ${formatMoney(plan.annualMonthlyMinor).replace(/\.00$/, "")}/mo billed yearly.`}
        </p>
      </div>

      <div className="mt-6">
        <RegisterForm plan={plan.id} />
      </div>
      <p className="mt-6 text-center text-[0.9375rem] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent hover:opacity-70">
          Log in
        </Link>
      </p>
    </>
  );
}
