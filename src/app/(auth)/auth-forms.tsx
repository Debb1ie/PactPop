"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice, Field, Input } from "@/components/ui/primitives";
import { Sparkles } from "lucide-react";
import { demoLoginAction, loginAction, registerAction, type AuthState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <ErrorNotice title="Couldn't sign you in" message={state.error} />}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@business.com" />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required placeholder="Required" />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Log in
      </Button>
    </form>
  );
}

/** One-click sign-in to the public demo workspace. */
export function DemoLoginButton() {
  const [state, action, pending] = useActionState<AuthState>(demoLoginAction, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <ErrorNotice title="Demo unavailable" message={state.error} />}
      <Button type="submit" variant="white" size="lg" className="w-full" loading={pending}>
        <Sparkles className="h-4 w-4 text-[#5a4af2]" /> Try the demo workspace
      </Button>
    </form>
  );
}

export function RegisterForm({ plan }: { plan: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="plan" value={plan} />
      {state?.error && <ErrorNotice message={state.error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" autoComplete="name" required placeholder="Maya Santos" />
        </Field>
        <Field label="Business name" htmlFor="businessName" error={fe.businessName}>
          <Input id="businessName" name="businessName" autoComplete="organization" required placeholder="Lumen Studio" />
        </Field>
      </div>
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@business.com" />
      </Field>
      <Field label="Password" htmlFor="password" error={fe.password} hint="At least 10 characters">
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Create my workspace
      </Button>
    </form>
  );
}
