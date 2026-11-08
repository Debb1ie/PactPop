import { cn } from "@/lib/cn";

type Tone = "neutral" | "violet" | "success" | "warning" | "error" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-fill text-muted",
  violet: "bg-accent-soft text-accent",
  info: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  error: "bg-error-soft text-error",
};

/** Maps every status in the system to a human label + tone, so wording stays consistent. */
const STATUS: Record<string, [string, Tone]> = {
  // commitments
  draft: ["Draft", "neutral"],
  proposed: ["Proposed", "violet"],
  awaiting_acceptance: ["Awaiting acceptance", "warning"],
  accepted: ["Accepted", "success"],
  in_progress: ["In progress", "violet"],
  awaiting_evidence: ["Awaiting evidence", "warning"],
  awaiting_approval: ["Awaiting approval", "warning"],
  payment_ready: ["Payment ready", "info"],
  completed: ["Completed", "success"],
  disputed: ["Disputed", "error"],
  cancelled: ["Cancelled", "neutral"],
  // requests
  new: ["New", "violet"],
  needs_info: ["Needs info", "warning"],
  analyzed: ["Analyzed", "info"],
  proposal_drafted: ["Proposal drafted", "violet"],
  converted: ["Converted", "success"],
  archived: ["Archived", "neutral"],
  // proposals
  owner_approved: ["Owner approved", "info"],
  sent: ["Sent", "violet"],
  declined: ["Declined", "error"],
  superseded: ["Superseded", "neutral"],
  // milestones / deliverables
  pending: ["Pending", "neutral"],
  submitted: ["Submitted", "warning"],
  approved: ["Approved", "success"],
  invoiced: ["Invoiced", "violet"],
  paid: ["Paid", "success"],
  verified: ["AI-checked", "info"],
  needs_changes: ["Needs changes", "error"],
  // invoices / payments
  scheduled: ["Scheduled", "neutral"],
  partially_paid: ["Partially paid", "warning"],
  marked_as_paid: ["Marked paid", "success"],
  refunded: ["Refunded", "neutral"],
  payment_pending: ["Payment pending", "warning"],
  unknown: ["Unknown", "neutral"],
  created: ["Created", "neutral"],
  failed: ["Failed", "error"],
  // approvals
  rejected: ["Rejected", "error"],
  changes_requested: ["Changes requested", "warning"],
  executed: ["Executed", "success"],
  // scope / change orders
  detected: ["Detected", "warning"],
  within_scope: ["Within scope", "success"],
  change_order_proposed: ["Change order proposed", "violet"],
  pending_owner_approval: ["Needs your approval", "warning"],
  client_accepted: ["Client accepted", "success"],
  // agent
  running: ["Running", "violet"],
  allowed: ["Allowed", "success"],
  approval_required: ["Approval required", "warning"],
  denied: ["Denied", "error"],
  error: ["Error", "error"],
};

export function statusLabel(status: string) {
  return STATUS[status]?.[0] ?? status.replace(/_/g, " ");
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const [label, tone] = STATUS[status] ?? [statusLabel(status), "neutral" as Tone];
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-[3px] px-1.5 py-[2px] font-mono text-[0.65rem] font-semibold uppercase tracking-[0.06em]", tones[tone], className)}>{label}</span>;
}
