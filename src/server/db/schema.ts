/**
 * PactPop relational schema.
 *
 * Conventions
 * - UUID primary keys generated in Postgres.
 * - Money is always integer minor units (`*_minor`, bigint mode "number" — safe up to 2^53)
 *   paired with an ISO-4217 `currency`. Never floats.
 * - Every tenant-owned row carries `business_id`; services must always filter by it.
 * - External PayPal identifiers live in their own unique columns, separate from internal ids.
 * - `is_demo` marks seeded demonstration data so the UI can label it.
 */
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ───────────────────────────── enums ─────────────────────────────

export const memberRole = pgEnum("member_role", ["owner", "admin", "member"]);

export const requestStatus = pgEnum("request_status", [
  "new",
  "needs_info",
  "analyzed",
  "proposal_drafted",
  "converted",
  "archived",
]);

export const proposalStatus = pgEnum("proposal_status", [
  "draft",
  "owner_approved",
  "sent",
  "accepted",
  "declined",
  "superseded",
]);

export const commitmentStatus = pgEnum("commitment_status", [
  "draft",
  "proposed",
  "awaiting_acceptance",
  "accepted",
  "in_progress",
  "awaiting_evidence",
  "awaiting_approval",
  "payment_ready",
  "completed",
  "disputed",
  "cancelled",
]);

export const milestoneKind = pgEnum("milestone_kind", ["deposit", "milestone", "final", "change_order"]);
export const milestoneStatus = pgEnum("milestone_status", [
  "pending",
  "in_progress",
  "submitted",
  "approved",
  "invoiced",
  "paid",
  "cancelled",
]);

export const deliverableStatus = pgEnum("deliverable_status", [
  "pending",
  "submitted",
  "verified",
  "needs_changes",
  "approved",
]);

export const scopeChangeStatus = pgEnum("scope_change_status", [
  "detected",
  "within_scope",
  "change_order_proposed",
  "accepted",
  "rejected",
]);

export const changeOrderStatus = pgEnum("change_order_status", [
  "draft",
  "pending_owner_approval",
  "owner_approved",
  "client_accepted",
  "rejected",
]);

export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "sent",
  "scheduled",
  "partially_paid",
  "paid",
  "marked_as_paid",
  "cancelled",
  "refunded",
  "payment_pending",
  "unknown",
]);

export const paymentStatus = pgEnum("payment_status", [
  "created",
  "approved",
  "pending",
  "completed",
  "declined",
  "refunded",
  "failed",
]);

export const approvalStatus = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "changes_requested",
  "executed",
  "failed",
]);

export const permissionPolicy = pgEnum("permission_policy", ["allow", "approval", "deny"]);

export const actorType = pgEnum("actor_type", ["user", "agent", "system", "paypal", "client"]);

export const executionStatus = pgEnum("execution_status", [
  "running",
  "completed",
  "awaiting_approval",
  "failed",
]);

export const toolDecision = pgEnum("tool_decision", ["allowed", "approval_required", "denied", "error"]);

// ───────────────────────────── helpers ─────────────────────────────

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => bigint(name, { mode: "number" });
const currency = () => text("currency").notNull().default("USD");
const businessId = () =>
  uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" });

// ───────────────────────────── identity & tenancy ─────────────────────────────

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    activeBusinessId: uuid("active_business_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export type PricingRules = {
  /** Price per standard page, minor units */
  pageRateMinor: number;
  /** Price per extra page added to an existing design system (change orders), minor units */
  additionalPageRateMinor: number;
  /** Hourly rate for custom features, minor units */
  hourlyRateMinor: number;
  /** Deposit percentage (0-100) */
  depositPercent: number;
  /** Minimum project size, minor units */
  minimumProjectMinor: number;
  /** Feature catalogue: estimated hours for common add-ons */
  featureHours: Record<string, number>;
};

export const businesses = pgTable("businesses", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  email: text("email"),
  currency: currency(),
  pricingRules: jsonb("pricing_rules").$type<PricingRules>().notNull(),
  brandColor: text("brand_color"),
  aiAutonomy: text("ai_autonomy").notNull().default("balanced"),
  /** Subscription plan id from src/lib/plans.ts. Paid plans start as a trial until billing is connected. */
  plan: text("plan").notNull().default("solo"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const businessMembers = pgTable(
  "business_members",
  {
    id: id(),
    businessId: businessId(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRole("role").notNull().default("member"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("business_members_unique").on(t.businessId, t.userId)],
);

// ───────────────────────────── clients & requests ─────────────────────────────

export const clients = pgTable(
  "clients",
  {
    id: id(),
    businessId: businessId(),
    name: text("name").notNull(),
    email: text("email"),
    company: text("company"),
    phone: text("phone"),
    website: text("website"),
    notes: text("notes"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("clients_business_idx").on(t.businessId), index("clients_email_idx").on(t.businessId, t.email)],
);

export type RequestExtraction = {
  projectType: string;
  summary: string;
  requirements: string[];
  deliverables: string[];
  budgetMinor: number | null;
  timelineDays: number | null;
  constraints: string[];
  missingInfo: string[];
  followUpQuestions: string[];
  /** Units used by the deterministic pricing engine */
  estimate?: { pages: number; features: string[]; extraHours: number };
  analyzedBy: "ai" | "heuristic";
};

export const projectRequests = pgTable(
  "project_requests",
  {
    id: id(),
    businessId: businessId(),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    contactName: text("contact_name").notNull(),
    contactEmail: text("contact_email").notNull(),
    company: text("company"),
    rawText: text("raw_text").notNull(),
    statedBudgetMinor: money("stated_budget_minor"),
    statedDeadline: text("stated_deadline"),
    source: text("source").notNull().default("portal"),
    extracted: jsonb("extracted").$type<RequestExtraction>(),
    status: requestStatus("status").notNull().default("new"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("requests_business_idx").on(t.businessId, t.status)],
);

// ───────────────────────────── proposals & commitments ─────────────────────────────

export type ScopeItem = { title: string; detail?: string; quantity?: number };
export type MilestonePlan = { title: string; kind: "deposit" | "milestone" | "final"; amountMinor: number; dueInDays: number };
export type PricingBreakdown = { label: string; quantity: number; unitMinor: number; totalMinor: number }[];

export const proposals = pgTable(
  "proposals",
  {
    id: id(),
    businessId: businessId(),
    requestId: uuid("request_id").references(() => projectRequests.id, { onDelete: "set null" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    scopeItems: jsonb("scope_items").$type<ScopeItem[]>().notNull(),
    exclusions: jsonb("exclusions").$type<string[]>().notNull().default([]),
    acceptanceCriteria: jsonb("acceptance_criteria").$type<string[]>().notNull().default([]),
    pricing: jsonb("pricing").$type<PricingBreakdown>().notNull(),
    totalMinor: money("total_minor").notNull(),
    currency: currency(),
    milestonePlan: jsonb("milestone_plan").$type<MilestonePlan[]>().notNull(),
    timelineDays: integer("timeline_days").notNull(),
    paymentTerms: text("payment_terms").notNull(),
    status: proposalStatus("status").notNull().default("draft"),
    ownerApprovedAt: timestamp("owner_approved_at", { withTimezone: true }),
    ownerApprovedBy: uuid("owner_approved_by").references(() => users.id),
    acceptTokenHash: text("accept_token_hash").unique(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedByName: text("accepted_by_name"),
    acceptedFromIp: text("accepted_from_ip"),
    generatedBy: text("generated_by").notNull().default("user"),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("proposals_business_idx").on(t.businessId, t.status)],
);

export const commitments = pgTable(
  "commitments",
  {
    id: id(),
    businessId: businessId(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    proposalId: uuid("proposal_id").references(() => proposals.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: commitmentStatus("status").notNull().default("draft"),
    agreedTotalMinor: money("agreed_total_minor").notNull(),
    currency: currency(),
    paymentTerms: text("payment_terms").notNull(),
    currentVersion: integer("current_version").notNull().default(1),
    startDate: timestamp("start_date", { withTimezone: true }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    isDemo: boolean("is_demo").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("commitments_business_idx").on(t.businessId, t.status),
    uniqueIndex("commitments_proposal_unique").on(t.proposalId),
  ],
);

/** Immutable snapshots of the agreed scope. Accepted agreements are never edited in place. */
export const commitmentVersions = pgTable(
  "commitment_versions",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    scopeItems: jsonb("scope_items").$type<ScopeItem[]>().notNull(),
    exclusions: jsonb("exclusions").$type<string[]>().notNull().default([]),
    totalMinor: money("total_minor").notNull(),
    reason: text("reason").notNull(),
    changeOrderId: uuid("change_order_id"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("commitment_versions_unique").on(t.commitmentId, t.version)],
);

export const milestones = pgTable(
  "milestones",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    kind: milestoneKind("kind").notNull().default("milestone"),
    amountMinor: money("amount_minor").notNull(),
    currency: currency(),
    position: integer("position").notNull().default(0),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: milestoneStatus("status").notNull().default("pending"),
    changeOrderId: uuid("change_order_id"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("milestones_commitment_idx").on(t.commitmentId)],
);

export type VerificationReport = {
  verified: string[];
  missing: string[];
  issues: string[];
  suggestions: string[];
  summary: string;
  analyzedBy: "ai" | "heuristic";
  analyzedAt: string;
};

export const deliverables = pgTable(
  "deliverables",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    acceptanceCriteria: jsonb("acceptance_criteria").$type<string[]>().notNull().default([]),
    status: deliverableStatus("status").notNull().default("pending"),
    submissionNotes: text("submission_notes"),
    verification: jsonb("verification").$type<VerificationReport>(),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("deliverables_commitment_idx").on(t.commitmentId)],
);

export const evidenceFiles = pgTable(
  "evidence_files",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    deliverableId: uuid("deliverable_id").references(() => deliverables.id, { onDelete: "set null" }),
    kind: text("kind").notNull(), // file | url | note
    label: text("label").notNull(),
    url: text("url"),
    storageKey: text("storage_key"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    sha256: text("sha256"),
    note: text("note"),
    uploadedBy: uuid("uploaded_by").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [index("evidence_commitment_idx").on(t.commitmentId)],
);

// ───────────────────────────── scope changes ─────────────────────────────

export type ScopeAnalysis = {
  withinScope: string[];
  additions: { item: string; rationale: string; estimatedHours: number; pages?: number }[];
  summary: string;
  analyzedBy: "ai" | "heuristic";
};

export const scopeChanges = pgTable(
  "scope_changes",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    requestText: text("request_text").notNull(),
    baselineVersion: integer("baseline_version").notNull(),
    analysis: jsonb("analysis").$type<ScopeAnalysis>(),
    status: scopeChangeStatus("status").notNull().default("detected"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("scope_changes_commitment_idx").on(t.commitmentId)],
);

export const changeOrders = pgTable(
  "change_orders",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    scopeChangeId: uuid("scope_change_id").references(() => scopeChanges.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    items: jsonb("items").$type<ScopeItem[]>().notNull(),
    pricing: jsonb("pricing").$type<PricingBreakdown>().notNull(),
    amountMinor: money("amount_minor").notNull(),
    currency: currency(),
    status: changeOrderStatus("status").notNull().default("draft"),
    approvedBy: uuid("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("change_orders_commitment_idx").on(t.commitmentId)],
);

// ───────────────────────────── payments (PayPal) ─────────────────────────────

export const invoices = pgTable(
  "invoices",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "restrict" }),
    milestoneId: uuid("milestone_id")
      .notNull()
      .references(() => milestones.id, { onDelete: "restrict" }),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),
    paypalInvoiceId: text("paypal_invoice_id").unique(),
    invoiceNumber: text("invoice_number"),
    status: invoiceStatus("status").notNull().default("draft"),
    amountMinor: money("amount_minor").notNull(),
    currency: currency(),
    payerViewUrl: text("payer_view_url"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    isSandbox: boolean("is_sandbox").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("invoices_business_idx").on(t.businessId, t.status),
    // one live invoice per milestone
    uniqueIndex("invoices_milestone_unique").on(t.milestoneId),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id").references(() => commitments.id, { onDelete: "set null" }),
    milestoneId: uuid("milestone_id").references(() => milestones.id, { onDelete: "set null" }),
    invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
    source: text("source").notNull(), // invoice | order
    paypalOrderId: text("paypal_order_id").unique(),
    paypalCaptureId: text("paypal_capture_id").unique(),
    paypalInvoicePaymentId: text("paypal_invoice_payment_id").unique(),
    approveUrl: text("approve_url"),
    status: paymentStatus("status").notNull().default("created"),
    amountMinor: money("amount_minor").notNull(),
    currency: currency(),
    feeMinor: money("fee_minor"),
    netMinor: money("net_minor"),
    payerEmail: text("payer_email"),
    verifiedVia: text("verified_via"), // webhook | api
    completedAt: timestamp("completed_at", { withTimezone: true }),
    isSandbox: boolean("is_sandbox").notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("payments_business_idx").on(t.businessId, t.status)],
);

/** Raw PayPal webhook deliveries. Unique event id gives duplicate-delivery protection. */
export const paymentEvents = pgTable(
  "payment_events",
  {
    id: id(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    paypalEventId: text("paypal_event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    resourceType: text("resource_type"),
    resourceId: text("resource_id"),
    payload: jsonb("payload").notNull(),
    signatureVerified: boolean("signature_verified").notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processingError: text("processing_error"),
    createdAt: createdAt(),
  },
  (t) => [index("payment_events_resource_idx").on(t.resourceId)],
);

// ───────────────────────────── TrustGate & agents ─────────────────────────────

export const approvals = pgTable(
  "approvals",
  {
    id: id(),
    businessId: businessId(),
    actionType: text("action_type").notNull(), // tool name, e.g. paypal.create_invoice
    title: text("title").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    amountMinor: money("amount_minor"),
    currency: text("currency"),
    commitmentId: uuid("commitment_id").references(() => commitments.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    reasoningSummary: text("reasoning_summary").notNull(),
    requestedByExecutionId: uuid("requested_by_execution_id"),
    requestedByUserId: uuid("requested_by_user_id").references(() => users.id),
    status: approvalStatus("status").notNull().default("pending"),
    decidedBy: uuid("decided_by").references(() => users.id),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decisionNote: text("decision_note"),
    result: jsonb("result"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("approvals_business_idx").on(t.businessId, t.status)],
);

export const agentExecutions = pgTable(
  "agent_executions",
  {
    id: id(),
    businessId: businessId(),
    userId: uuid("user_id").references(() => users.id),
    conversationId: uuid("conversation_id"),
    role: text("role").notNull(),
    input: text("input").notNull(),
    intent: text("intent"),
    status: executionStatus("status").notNull().default("running"),
    output: jsonb("output"),
    provider: text("provider").notNull(),
    model: text("model"),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    error: text("error"),
    createdAt: createdAt(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("agent_exec_business_idx").on(t.businessId, t.createdAt),
    index("agent_exec_conversation_idx").on(t.conversationId),
  ],
);

export const agentToolCalls = pgTable(
  "agent_tool_calls",
  {
    id: id(),
    businessId: businessId(),
    executionId: uuid("execution_id")
      .notNull()
      .references(() => agentExecutions.id, { onDelete: "cascade" }),
    tool: text("tool").notNull(),
    args: jsonb("args").notNull(),
    decision: toolDecision("decision").notNull(),
    approvalId: uuid("approval_id").references(() => approvals.id, { onDelete: "set null" }),
    result: jsonb("result"),
    error: text("error"),
    durationMs: integer("duration_ms"),
    createdAt: createdAt(),
  },
  (t) => [index("agent_tool_calls_exec_idx").on(t.executionId)],
);

export const agentPermissions = pgTable(
  "agent_permissions",
  {
    id: id(),
    businessId: businessId(),
    tool: text("tool").notNull(),
    policy: permissionPolicy("policy").notNull(),
    updatedBy: uuid("updated_by").references(() => users.id),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("agent_permissions_unique").on(t.businessId, t.tool)],
);

// ───────────────────────────── audit, timeline, notifications ─────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: id(),
    businessId: uuid("business_id").references(() => businesses.id, { onDelete: "cascade" }),
    actorType: actorType("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ip: text("ip"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_business_idx").on(t.businessId, t.createdAt), index("audit_entity_idx").on(t.entityType, t.entityId)],
);

/**
 * Commitment-scoped event stream. Powers the Commitment Timeline, the Evidence Vault and VowGraph.
 * `refType`/`refId` point at the real row (proposal, invoice, payment, change_order, …).
 */
export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: id(),
    businessId: businessId(),
    commitmentId: uuid("commitment_id")
      .notNull()
      .references(() => commitments.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    detail: text("detail"),
    refType: text("ref_type"),
    refId: uuid("ref_id"),
    actorType: actorType("actor_type").notNull(),
    actorLabel: text("actor_label"),
    amountMinor: money("amount_minor"),
    createdAt: createdAt(),
  },
  (t) => [index("timeline_commitment_idx").on(t.commitmentId, t.createdAt)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    businessId: businessId(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.businessId, t.userId, t.readAt)],
);

// ───────────────────────────── relations ─────────────────────────────

export const clientsRelations = relations(clients, ({ many }) => ({
  commitments: many(commitments),
  requests: many(projectRequests),
  proposals: many(proposals),
  invoices: many(invoices),
}));

export const commitmentsRelations = relations(commitments, ({ one, many }) => ({
  client: one(clients, { fields: [commitments.clientId], references: [clients.id] }),
  proposal: one(proposals, { fields: [commitments.proposalId], references: [proposals.id] }),
  milestones: many(milestones),
  deliverables: many(deliverables),
  versions: many(commitmentVersions),
  scopeChanges: many(scopeChanges),
  changeOrders: many(changeOrders),
  invoices: many(invoices),
  payments: many(payments),
  timeline: many(timelineEvents),
  evidence: many(evidenceFiles),
}));

export const proposalsRelations = relations(proposals, ({ one }) => ({
  client: one(clients, { fields: [proposals.clientId], references: [clients.id] }),
  request: one(projectRequests, { fields: [proposals.requestId], references: [projectRequests.id] }),
}));

export const projectRequestsRelations = relations(projectRequests, ({ one }) => ({
  client: one(clients, { fields: [projectRequests.clientId], references: [clients.id] }),
}));

export const milestonesRelations = relations(milestones, ({ one, many }) => ({
  commitment: one(commitments, { fields: [milestones.commitmentId], references: [commitments.id] }),
  invoice: one(invoices, { fields: [milestones.id], references: [invoices.milestoneId] }),
  deliverables: many(deliverables),
}));

export const deliverablesRelations = relations(deliverables, ({ one, many }) => ({
  commitment: one(commitments, { fields: [deliverables.commitmentId], references: [commitments.id] }),
  milestone: one(milestones, { fields: [deliverables.milestoneId], references: [milestones.id] }),
  evidence: many(evidenceFiles),
}));

export const evidenceFilesRelations = relations(evidenceFiles, ({ one }) => ({
  commitment: one(commitments, { fields: [evidenceFiles.commitmentId], references: [commitments.id] }),
  deliverable: one(deliverables, { fields: [evidenceFiles.deliverableId], references: [deliverables.id] }),
}));

export const commitmentVersionsRelations = relations(commitmentVersions, ({ one }) => ({
  commitment: one(commitments, { fields: [commitmentVersions.commitmentId], references: [commitments.id] }),
}));

export const scopeChangesRelations = relations(scopeChanges, ({ one, many }) => ({
  commitment: one(commitments, { fields: [scopeChanges.commitmentId], references: [commitments.id] }),
  changeOrders: many(changeOrders),
}));

export const changeOrdersRelations = relations(changeOrders, ({ one }) => ({
  commitment: one(commitments, { fields: [changeOrders.commitmentId], references: [commitments.id] }),
  scopeChange: one(scopeChanges, { fields: [changeOrders.scopeChangeId], references: [scopeChanges.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  commitment: one(commitments, { fields: [invoices.commitmentId], references: [commitments.id] }),
  milestone: one(milestones, { fields: [invoices.milestoneId], references: [milestones.id] }),
  client: one(clients, { fields: [invoices.clientId], references: [clients.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  commitment: one(commitments, { fields: [payments.commitmentId], references: [commitments.id] }),
  milestone: one(milestones, { fields: [payments.milestoneId], references: [milestones.id] }),
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  commitment: one(commitments, { fields: [timelineEvents.commitmentId], references: [commitments.id] }),
}));

export const agentExecutionsRelations = relations(agentExecutions, ({ many }) => ({
  toolCalls: many(agentToolCalls),
}));

export const agentToolCallsRelations = relations(agentToolCalls, ({ one }) => ({
  execution: one(agentExecutions, { fields: [agentToolCalls.executionId], references: [agentExecutions.id] }),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  commitment: one(commitments, { fields: [approvals.commitmentId], references: [commitments.id] }),
  client: one(clients, { fields: [approvals.clientId], references: [clients.id] }),
}));

export const businessMembersRelations = relations(businessMembers, ({ one }) => ({
  business: one(businesses, { fields: [businessMembers.businessId], references: [businesses.id] }),
  user: one(users, { fields: [businessMembers.userId], references: [users.id] }),
}));
