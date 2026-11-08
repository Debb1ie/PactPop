"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { decideApprovalAction } from "@/app/app/approvals/actions";
import { cn } from "@/lib/cn";

export type ApprovalView = {
  id: string;
  title: string;
  amount: string | null;
  reason: string;
  client?: string | null;
  commitment?: string | null;
  status?: string;
  createdAt?: string;
};

/** A TrustGate approval with Approve / Reject. Approving executes the action server-side. */
export function ApprovalCard({ approval, compact }: { approval: ApprovalView; compact?: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<"pending" | "executed" | "rejected" | "failed">((approval.status as never) ?? "pending");
  const router = useRouter();
  const toast = useToast();

  const decide = (d: "approve" | "reject") =>
    start(async () => {
      const r = await decideApprovalAction(approval.id, d);
      toast({ tone: r.ok ? "success" : "error", title: r.message, description: r.ok && d === "approve" ? approval.title : undefined });
      if (r.ok) setState(d === "approve" ? "executed" : "rejected");
      else setState("failed");
      router.refresh();
    });

  return (
    <div className={cn("rounded-xl border bg-surface", state === "pending" ? "border-warning/40" : "border-border", compact ? "p-3.5" : "p-4")}>
      <div className="flex items-start gap-3">
        <ShieldCheck className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", state === "pending" ? "text-warning" : state === "executed" ? "text-success" : "text-muted")} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-[0.9375rem] font-semibold">{approval.title}</p>
            {approval.amount && <p className="money font-semibold">{approval.amount}</p>}
          </div>
          {(approval.client || approval.commitment) && <p className="text-[0.8125rem] text-muted">{[approval.client, approval.commitment].filter(Boolean).join(" · ")}</p>}
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">
            <span className="font-medium text-foreground">Agent&apos;s reasoning: </span>
            {approval.reason}
          </p>
          {state === "pending" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => decide("approve")} loading={pending}>
                <Check className="h-3.5 w-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => decide("reject")} disabled={pending}>
                <X className="h-3.5 w-3.5" /> Reject
              </Button>
            </div>
          ) : (
            <p className={cn("mt-2 text-[0.8125rem] font-semibold", state === "executed" ? "text-success" : state === "failed" ? "text-error" : "text-muted")}>
              {state === "executed" ? "Approved and applied" : state === "rejected" ? "Rejected" : "Couldn't be completed"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
