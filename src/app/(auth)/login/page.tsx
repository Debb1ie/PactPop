import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <div className="text-center">
        <LogoMark className="mx-auto h-[4.5rem] w-[4.5rem] drop-shadow-[0_12px_24px_rgb(118_86_232/0.35)]" />
        <h1 className="mt-5 text-[1.75rem] font-bold">Welcome back</h1>
        <p className="mt-1 text-[0.9375rem] text-muted">Log in to your PactPop workspace.</p>
      </div>
      <div className="mt-8">
        <LoginForm />
      </div>
      <div className="mt-6 rounded-2xl bg-surface px-4 py-3 text-center text-[0.8125rem] text-muted shadow-[var(--shadow-card)] dark:shadow-none">
        <p className="font-semibold text-foreground">Demo account</p>
        <p className="mt-0.5">
          <span className="font-mono text-xs">demo@pactpop.dev</span> · <span className="font-mono text-xs">pactpop-demo-2026</span>
        </p>
        <p className="mt-0.5 text-xs">Available after running npm run db:seed</p>
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
