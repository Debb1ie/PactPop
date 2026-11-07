/**
 * TrustGate default policies — the single source of truth for which agent tools may run
 * unattended, which need a human approval, and which are blocked.
 *
 * Businesses can tighten or loosen *configurable* tools in Settings. Locked tools can never be
 * relaxed below their floor, regardless of configuration or anything a model says.
 */
export type Policy = "allow" | "approval" | "deny";

export type ToolPolicyDef = {
  tool: string;
  label: string;
  category: "read" | "draft" | "communicate" | "financial";
  defaultPolicy: Policy;
  /** Minimum strictness. "approval" means it can never be set to "allow". */
  floor?: Policy;
};

export const TOOL_POLICIES: ToolPolicyDef[] = [
  // read
  { tool: "business.summary", label: "Read business summary", category: "read", defaultPolicy: "allow" },
  { tool: "clients.search", label: "Read clients", category: "read", defaultPolicy: "allow" },
  { tool: "commitments.search", label: "Read commitments", category: "read", defaultPolicy: "allow" },
  { tool: "commitments.get", label: "Read commitment details", category: "read", defaultPolicy: "allow" },
  { tool: "requests.list", label: "Read project requests", category: "read", defaultPolicy: "allow" },
  { tool: "invoices.list", label: "Read invoices", category: "read", defaultPolicy: "allow" },
  { tool: "payments.list", label: "Read transactions", category: "read", defaultPolicy: "allow" },
  { tool: "approvals.list", label: "Read approval queue", category: "read", defaultPolicy: "allow" },
  { tool: "finance.summary", label: "Read financial summary", category: "read", defaultPolicy: "allow" },
  // draft (creates drafts only — nothing leaves PactPop)
  { tool: "requests.analyze", label: "Analyze project requests", category: "draft", defaultPolicy: "allow" },
  { tool: "pricing.quote", label: "Calculate a quote", category: "draft", defaultPolicy: "allow" },
  { tool: "proposals.draft", label: "Draft proposals", category: "draft", defaultPolicy: "allow" },
  { tool: "scope.analyze", label: "Analyze scope changes", category: "draft", defaultPolicy: "allow" },
  { tool: "change_orders.draft", label: "Draft change orders", category: "draft", defaultPolicy: "allow" },
  { tool: "deliverables.verify", label: "Verify deliverable evidence", category: "draft", defaultPolicy: "allow" },
  { tool: "reminders.draft", label: "Draft reminders", category: "draft", defaultPolicy: "allow" },
  // communicate / external
  { tool: "proposals.send", label: "Send proposals to clients", category: "communicate", defaultPolicy: "approval" },
  { tool: "paypal.create_invoice", label: "Create PayPal invoices (draft)", category: "financial", defaultPolicy: "allow" },
  { tool: "paypal.send_invoice", label: "Send PayPal invoices", category: "financial", defaultPolicy: "approval" },
  { tool: "paypal.create_order", label: "Create PayPal checkout orders", category: "financial", defaultPolicy: "approval" },
  { tool: "paypal.sync_status", label: "Refresh payment status from PayPal", category: "financial", defaultPolicy: "allow" },
  // locked financial controls
  { tool: "paypal.capture_order", label: "Capture payments", category: "financial", defaultPolicy: "approval", floor: "approval" },
  { tool: "paypal.refund", label: "Issue refunds", category: "financial", defaultPolicy: "approval", floor: "approval" },
  { tool: "commitments.change_amount", label: "Change agreed amounts", category: "financial", defaultPolicy: "approval", floor: "approval" },
  { tool: "change_orders.apply", label: "Apply change orders to agreements", category: "financial", defaultPolicy: "approval", floor: "approval" },
];

const RANK: Record<Policy, number> = { allow: 0, approval: 1, deny: 2 };

export function policyDef(tool: string): ToolPolicyDef | undefined {
  return TOOL_POLICIES.find((p) => p.tool === tool);
}

/** Combine configured policy with the locked floor. Unknown tools are denied. */
export function effectivePolicy(tool: string, configured?: Policy | null): Policy {
  const def = policyDef(tool);
  if (!def) return "deny";
  const chosen = configured ?? def.defaultPolicy;
  if (def.floor && RANK[chosen] < RANK[def.floor]) return def.floor;
  return chosen;
}
