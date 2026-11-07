"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice, Field, Input } from "@/components/ui/primitives";
import { loginAction, registerAction, type AuthState } from "./actions";

export function LoginForm({ demoEmail }: { demoEmail?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <ErrorNotice title="Couldn't sign you in" message={state.error} />}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={demoEmail} />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Log in
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
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Business name" htmlFor="businessName" error={fe.businessName}>
          <Input id="businessName" name="businessName" autoComplete="organization" required />
        </Field>
      </div>
      <Field label="Email" htmlFor="email" error={fe.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required />
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
