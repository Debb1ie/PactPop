import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
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
      <h1 className="text-3xl font-semibold">Create your workspace</h1>
      <p className="mt-2 text-sm text-muted">Set up your business. You&apos;ll get a client request link straight away.</p>

      <div className="mt-6 rounded-2xl border border-accent/30 bg-accent-soft/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display font-semibold">
            {plan.name} {paid ? "· 14-day free trial" : "· free forever"}
          </p>
          {paid && <span className="money text-sm text-muted">then {formatMoney(plan.annualMonthlyMinor).replace(/\.00$/, "")}/mo yearly</span>}
        </div>
        <ul className="mt-2 grid gap-1 text-sm text-muted sm:grid-cols-2">
          {plan.highlights.slice(0, 4).map((h) => (
            <li key={h} className="flex gap-1.5">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> {h}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          No card required.{" "}
          <Link href="/pricing" className="text-accent hover:underline">
            Change plan
          </Link>
        </p>
      </div>

      <div className="mt-6">
        <RegisterForm plan={plan.id} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Log in
        </Link>
      </p>
    </>
  );
}
