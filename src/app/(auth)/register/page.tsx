import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = { title: "Create your workspace" };

export default function RegisterPage() {
  return (
    <>
      <div className="text-center">
        <LogoMark className="mx-auto h-[4.5rem] w-[4.5rem]" />
        <h1 className="mt-5 text-[1.75rem] font-semibold">Create your workspace</h1>
        <p className="mt-1 text-[0.9375rem] text-muted">Free and open source. You&apos;ll get a client request link straight away.</p>
      </div>
      <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-5">
        <RegisterForm />
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
