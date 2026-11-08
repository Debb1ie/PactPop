import type { Metadata } from "next";
import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { DemoLoginButton, LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <div className="text-center">
        <Mascot mood="wink-card" width={132} priority className="mx-auto" />
        <h1 className="mt-5 text-[1.75rem] font-semibold">Welcome back</h1>
        <p className="mt-1 text-[0.9375rem] text-muted">Log in to your PactPop workspace.</p>
      </div>

      <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <p className="text-sm font-semibold">Just looking around?</p>
        <p className="mt-0.5 text-[0.8125rem] text-muted">Open a sample workspace with clients, a live proposal and a change order waiting for approval.</p>
        <div className="mt-4">
          <DemoLoginButton />
        </div>
        <p className="mt-3 text-center text-xs text-muted">
          or sign in manually: <span className="font-mono text-foreground">{DEMO_EMAIL}</span> · <span className="font-mono text-foreground">{DEMO_PASSWORD}</span>
        </p>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" /> Your account <span className="h-px flex-1 bg-border" />
      </div>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-[0.9375rem] text-muted">
        New to PactPop?{" "}
        <Link href="/register" className="font-semibold text-accent hover:opacity-70">
          Create a workspace
        </Link>
      </p>
    </>
  );
}
