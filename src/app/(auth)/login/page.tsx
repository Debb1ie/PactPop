import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/ui/primitives";
import { LoginForm } from "../auth-forms";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-sm text-muted">Log in to your PactPop workspace.</p>
      <Notice className="mt-6">
        <p className="font-medium">Demo account</p>
        <p className="mt-0.5 text-muted">
          After running <code className="money text-xs">npm run db:seed</code>: <span className="money text-xs">demo@pactpop.dev</span> /{" "}
          <span className="money text-xs">pactpop-demo-2026</span>
        </p>
      </Notice>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        New to PactPop?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Create a workspace
        </Link>
      </p>
    </>
  );
}
