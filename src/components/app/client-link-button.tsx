"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { clientLinkAction } from "@/app/app/commitments/actions";
import { useToast } from "@/components/ui/toast";

const pill = "pure inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[0.75rem] font-medium text-foreground transition-opacity hover:opacity-80 disabled:opacity-50";

/** Creates the client's agreement + checkout link, copies it, and offers to open it. */
export function ClientLinkButton({ commitmentId }: { commitmentId: string }) {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const toast = useToast();
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        className={pill}
        onClick={() =>
          start(async () => {
            const r = await clientLinkAction(commitmentId);
            if (r.url) {
              setUrl(r.url);
              try {
                await navigator.clipboard.writeText(r.url);
              } catch {
                /* clipboard may be blocked; the Open link still works */
              }
            }
            toast({ tone: r.ok ? "success" : "error", title: r.message, description: r.ok ? "Send it to your client. Creating a new link turns off the old one." : undefined });
          })
        }
      >
        <Link2 className="h-3.5 w-3.5 text-[#6c4ef5]" /> {pending ? "Creating…" : "Client link"}
      </button>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className={pill} aria-label="Open the client view">
          Open <ExternalLink className="h-3 w-3 text-muted" />
        </a>
      )}
    </span>
  );
}
