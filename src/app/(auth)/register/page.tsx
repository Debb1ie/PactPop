import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "../auth-forms";

export const metadata: Metadata = { title: "Create your workspace" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold">Create your workspace</h1>
      <p className="mt-2 text-sm text-muted">Set up your business. You&apos;ll get a client request link straight away.</p>
      <div className="mt-8">
        <RegisterForm />
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
