"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Paperclip, X } from "lucide-react";
import { submitProofAction } from "@/app/app/commitments/actions";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";

const pill = "pure inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.75rem] font-medium text-foreground transition-opacity hover:opacity-80";

/** Owner attaches delivery proof (notes + links) to a deliverable for ProofFlow to check. */
export function ProofButton({ deliverableId, title, criteria }: { deliverableId: string; title: string; criteria: string[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  const submit = (form: FormData) =>
    start(async () => {
      setError(null);
      const r = await submitProofAction(deliverableId, String(form.get("notes") ?? ""), String(form.get("links") ?? ""));
      if (!r.ok) return setError(r.message);
      ref.current?.close();
      toast({ tone: "success", title: r.message, description: "Ask the AI Agents: “Check the delivery proof”." });
      router.refresh();
    });

  return (
    <>
      <button type="button" className={pill} onClick={() => ref.current?.showModal()}>
        <Paperclip className="h-3.5 w-3.5 text-[#0f9182]" /> Add proof
      </button>
      <dialog ref={ref} aria-label={`Add proof for ${title}`} onClick={(e) => e.target === ref.current && ref.current?.close()} className="m-auto w-full max-w-lg rounded-[1.75rem] bg-surface p-0 text-foreground shadow-[0_40px_100px_-30px_rgb(0_0_0/0.6)] ring-1 ring-border">
        <form action={submit} className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[1.125rem] font-semibold">Proof for {title}</h2>
              <p className="mt-1 text-[0.8125rem] text-muted">ProofFlow checks it against: {criteria.join(" · ") || "the agreed scope"}</p>
            </div>
            <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-fill">
              <X className="h-4 w-4" />
            </button>
          </div>
          {error && <p className="text-[0.875rem] text-[#ec6b74]">{error}</p>}
          <Field label="What did you deliver?" htmlFor={`notes-${deliverableId}`}>
            <Textarea id={`notes-${deliverableId}`} name="notes" rows={4} required placeholder="Pages are live on staging. Tested on iPhone and Android, no layout issues." />
          </Field>
          <Field label="Links (one per line, https)" htmlFor={`links-${deliverableId}`} hint="Staging site, screenshots, test results…">
            <Textarea id={`links-${deliverableId}`} name="links" rows={2} placeholder="https://staging.example.com" />
          </Field>
          <Button type="submit" className="w-full" loading={pending}>
            Submit proof
          </Button>
        </form>
      </dialog>
    </>
  );
}
