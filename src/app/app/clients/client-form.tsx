"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorNotice, Field, Input, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import type { ClientFormState } from "./actions";

type Defaults = { name?: string; email?: string | null; company?: string | null; phone?: string | null; website?: string | null; notes?: string | null };

export function ClientForm({
  action,
  defaults = {},
  submitLabel,
}: {
  action: (state: ClientFormState, form: FormData) => Promise<ClientFormState>;
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const toast = useToast();
  useEffect(() => {
    if (state?.ok) toast({ tone: "success", title: "Client saved" });
  }, [state, toast]);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <ErrorNotice message={state.error} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact name" htmlFor="name" error={fe.name}>
          <Input id="name" name="name" required defaultValue={defaults.name} />
        </Field>
        <Field label="Company" htmlFor="company" error={fe.company}>
          <Input id="company" name="company" defaultValue={defaults.company ?? ""} />
        </Field>
        <Field label="Email" htmlFor="email" error={fe.email} hint="Used for PayPal invoices">
          <Input id="email" name="email" type="email" defaultValue={defaults.email ?? ""} />
        </Field>
        <Field label="Phone" htmlFor="phone" error={fe.phone}>
          <Input id="phone" name="phone" defaultValue={defaults.phone ?? ""} />
        </Field>
      </div>
      <Field label="Website" htmlFor="website" error={fe.website}>
        <Input id="website" name="website" placeholder="https://" defaultValue={defaults.website ?? ""} />
      </Field>
      <Field label="Internal notes" htmlFor="notes" error={fe.notes} hint="Only visible to your team">
        <Textarea id="notes" name="notes" defaultValue={defaults.notes ?? ""} />
      </Field>
      <Button type="submit" loading={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
