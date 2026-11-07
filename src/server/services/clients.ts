import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import type { Database } from "@/server/db/create";
import { clients, commitments, invoices, payments, projectRequests } from "@/server/db/schema";
import { recordAudit } from "./audit";

export const clientInput = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email").max(200).optional().or(z.literal("").transform(() => undefined)),
  company: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z
    .string()
    .trim()
    .max(300)
    .refine((v) => !v || /^https?:\/\//i.test(v), "Website must start with http:// or https://")
    .optional(),
  notes: z.string().trim().max(5000).optional(),
});
export type ClientInput = z.infer<typeof clientInput>;

const OUTSTANDING_INVOICE = ["sent", "scheduled", "partially_paid", "payment_pending", "unknown"] as const;

export async function listClients(db: Database, businessId: string, q?: string) {
  const search = q?.trim();
  const rows = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.businessId, businessId),
        search ? or(ilike(clients.name, `%${search}%`), ilike(clients.company, `%${search}%`), ilike(clients.email, `%${search}%`)) : undefined,
      ),
    )
    .orderBy(asc(clients.name))
    .limit(500);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const [active, paid, outstanding] = await Promise.all([
    db
      .select({ clientId: commitments.clientId, n: sql<number>`count(*)::int` })
      .from(commitments)
      .where(and(eq(commitments.businessId, businessId), inArray(commitments.clientId, ids), sql`${commitments.status} not in ('completed','cancelled')`))
      .groupBy(commitments.clientId),
    db
      .select({ clientId: commitments.clientId, total: sql<number>`coalesce(sum(${payments.amountMinor}),0)::bigint` })
      .from(payments)
      .innerJoin(commitments, eq(commitments.id, payments.commitmentId))
      .where(and(eq(payments.businessId, businessId), eq(payments.status, "completed"), inArray(commitments.clientId, ids)))
      .groupBy(commitments.clientId),
    db
      .select({ clientId: invoices.clientId, total: sql<number>`coalesce(sum(${invoices.amountMinor}),0)::bigint` })
      .from(invoices)
      .where(and(eq(invoices.businessId, businessId), inArray(invoices.clientId, ids), inArray(invoices.status, [...OUTSTANDING_INVOICE])))
      .groupBy(invoices.clientId),
  ]);
  const byId = <T extends { clientId: string }>(list: T[]) => new Map(list.map((x) => [x.clientId, x]));
  const a = byId(active), p = byId(paid), o = byId(outstanding);
  return rows.map((c) => ({
    ...c,
    activeCommitments: a.get(c.id)?.n ?? 0,
    paidMinor: Number(p.get(c.id)?.total ?? 0),
    outstandingMinor: Number(o.get(c.id)?.total ?? 0),
  }));
}

export async function getClient(db: Database, businessId: string, clientId: string) {
  const client = await db.query.clients.findFirst({ where: and(eq(clients.businessId, businessId), eq(clients.id, clientId)) });
  if (!client) return null;
  const [clientCommitments, clientInvoices, clientPayments, requests] = await Promise.all([
    db.query.commitments.findMany({ where: and(eq(commitments.businessId, businessId), eq(commitments.clientId, clientId)), orderBy: desc(commitments.createdAt) }),
    db.query.invoices.findMany({ where: and(eq(invoices.businessId, businessId), eq(invoices.clientId, clientId)), orderBy: desc(invoices.createdAt) }),
    db
      .select({ payment: payments, commitmentTitle: commitments.title })
      .from(payments)
      .innerJoin(commitments, eq(commitments.id, payments.commitmentId))
      .where(and(eq(payments.businessId, businessId), eq(commitments.clientId, clientId)))
      .orderBy(desc(payments.createdAt)),
    db.query.projectRequests.findMany({
      where: and(eq(projectRequests.businessId, businessId), eq(projectRequests.clientId, clientId)),
      orderBy: desc(projectRequests.createdAt),
    }),
  ]);
  const paidMinor = clientPayments.filter((p) => p.payment.status === "completed").reduce((s, p) => s + p.payment.amountMinor, 0);
  const outstandingMinor = clientInvoices.filter((i) => (OUTSTANDING_INVOICE as readonly string[]).includes(i.status)).reduce((s, i) => s + i.amountMinor, 0);
  return { client, commitments: clientCommitments, invoices: clientInvoices, payments: clientPayments, requests, paidMinor, outstandingMinor };
}

export async function createClient(db: Database, businessId: string, actorUserId: string, input: ClientInput) {
  const data = clientInput.parse(input);
  const [row] = await db
    .insert(clients)
    .values({ businessId, ...data, email: data.email?.toLowerCase() })
    .returning();
  await recordAudit(db, { businessId, actor: { type: "user", id: actorUserId }, action: "client.created", entityType: "client", entityId: row.id, after: row });
  return row;
}

export async function updateClient(db: Database, businessId: string, actorUserId: string, clientId: string, input: ClientInput) {
  const data = clientInput.parse(input);
  const before = await db.query.clients.findFirst({ where: and(eq(clients.businessId, businessId), eq(clients.id, clientId)) });
  if (!before) throw new Error("Client not found");
  const [row] = await db
    .update(clients)
    .set({ ...data, email: data.email?.toLowerCase() ?? null, updatedAt: new Date() })
    .where(and(eq(clients.businessId, businessId), eq(clients.id, clientId)))
    .returning();
  await recordAudit(db, { businessId, actor: { type: "user", id: actorUserId }, action: "client.updated", entityType: "client", entityId: clientId, before, after: row });
  return row;
}

/** Find a client by email within the tenant, or create one (used by the intake portal). */
export async function findOrCreateClient(db: Database, businessId: string, input: { name: string; email: string; company?: string | null }) {
  const email = input.email.trim().toLowerCase();
  const existing = await db.query.clients.findFirst({ where: and(eq(clients.businessId, businessId), eq(clients.email, email)) });
  if (existing) return existing;
  const [row] = await db.insert(clients).values({ businessId, name: input.name.trim(), email, company: input.company?.trim() || null }).returning();
  return row;
}
