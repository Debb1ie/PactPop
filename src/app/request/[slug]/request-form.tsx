"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNotice, Field, Input, Textarea } from "@/components/ui/primitives";
import { submitRequestAction, type RequestState } from "./actions";

export function RequestForm({ slug, businessName }: { slug: string; businessName: string }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(submitRequestAction.bind(null, slug), undefined);
  const fe = state?.fieldErrors ?? {};

  if (state?.ok) {
    return (
      <div className="py-10 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-[1.05rem] bg-gradient-to-b from-[#5ee08a] to-[#24a148] text-white shadow-[0_12px_24px_-12px_rgb(0_0_0/0.5)]">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-[1.5rem] font-semibold tracking-[-0.02em]">Request sent</h2>
        <p className="mx-auto mt-2 max-w-sm text-[0.9375rem] text-muted">{businessName} will review it and reply with a proposal. You don&apos;t need to do anything else for now.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state?.error && <ErrorNotice title="Couldn't send your request" message={state.error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" autoComplete="name" required placeholder="Daniel Reyes" />
        </Field>
        <Field label="Email" htmlFor="email" error={fe.email}>
          <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@company.com" />
        </Field>
      </div>
      <Field label="Company (optional)" htmlFor="company" error={fe.company}>
        <Input id="company" name="company" autoComplete="organization" placeholder="Northwind Bakery" />
      </Field>
      <Field label="What do you need?" htmlFor="message" error={fe.message} hint="Pages, features, anything you already know. Plain words are fine.">
        <Textarea id="message" name="message" required rows={6} placeholder="We need a 5-page website with our menu, a catering page and a contact form. Mobile friendly, with basic SEO." />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Budget in USD (optional)" htmlFor="budget" error={fe.budget}>
          <Input id="budget" name="budget" inputMode="decimal" placeholder="1500" />
        </Field>
        <Field label="Deadline (optional)" htmlFor="deadline" error={fe.deadline}>
          <Input id="deadline" name="deadline" placeholder="End of next month" />
        </Field>
      </div>
      {/* honeypot */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        Send request
      </Button>
      <p className="text-center text-[0.75rem] text-muted">Your request goes to {businessName} only. No payment is taken now.</p>
    </form>
  );
}
