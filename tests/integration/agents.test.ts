/**
 * End-to-end agent workflow on a real (in-memory) Postgres: the same code paths the Command
 * Center uses, in rule-based mode (no AI key needed).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { createDatabase, migrateDatabase, type Database } from "@/server/db/create";
import { agentPermissions, agentToolCalls, approvals, commitments, milestones, projectRequests, proposals } from "@/server/db/schema";
import { createDemoWorkspace } from "@/server/services/demo";
import { runCommand, type AgentEvent } from "@/server/agents/orchestrator";
import { decideApproval } from "@/server/services/workflow";

let db: Database;
let businessId: string;
let userId: string;

async function run(input: string) {
  const events: AgentEvent[] = [];
  await runCommand({ db, businessId, userId, input, emit: (e) => events.push(e) });
  return events;
}

beforeAll(async () => {
  delete process.env.AI_API_KEY; // force rule-based mode
  db = await createDatabase("memory://");
  await migrateDatabase(db, "memory://");
  const { user, business } = await createDemoWorkspace(db);
  businessId = business.id;
  userId = user.id;
}, 60_000);

describe("agent workflow (rule-based mode)", () => {
  it("Intake Agent analyses the new Kitefly request and stores the result", async () => {
    const ev = await run("Analyse the new request from Kitefly Tours");
    expect(ev[0]).toMatchObject({ type: "start", mode: "heuristic" });
    expect(ev.filter((e) => e.type === "tool_call").map((e) => (e as { tool: string }).tool)).toEqual(["list_requests", "get_request", "save_request_analysis", "quote_project"]);
    expect(ev.at(-1)).toMatchObject({ type: "done", status: "completed" });
    const [req] = await db.select().from(projectRequests).where(and(eq(projectRequests.businessId, businessId), eq(projectRequests.company, "Kitefly Tours")));
    expect(req.extracted?.estimate?.features).toContain("booking system");
    expect(req.extracted?.missingInfo).toContain("Budget");
  });

  it("Proposal Agent drafts a priced proposal; sending it is queued by TrustGate", async () => {
    const ev = await run("Draft and send a proposal for Kitefly Tours");
    const send = ev.find((e) => e.type === "tool_call" && e.tool === "send_proposal");
    expect(send).toMatchObject({ decision: "approval_required" });
    const kite = await db.select().from(proposals).where(and(eq(proposals.businessId, businessId), eq(proposals.status, "draft")));
    expect(kite.length).toBe(1);
    expect(kite[0].totalMinor).toBeGreaterThan(0);
    // prices come from the engine: milestones sum to the total
    expect(kite[0].milestonePlan.reduce((s, m) => s + m.amountMinor, 0)).toBe(kite[0].totalMinor);
    expect(ev.at(-1)).toMatchObject({ type: "done", status: "awaiting_approval" });
  });

  it("ScopeWatch prices a booking system as a change order and approval applies it as agreement v2", async () => {
    const ev = await run("Northwind asked for a booking system too. Check the scope.");
    const approval = ev.find((e) => e.type === "approval") as Extract<AgentEvent, { type: "approval" }>;
    expect(approval).toBeTruthy();

    const [nwBefore] = await db.select().from(commitments).where(and(eq(commitments.businessId, businessId), eq(commitments.title, "Website redesign")));
    expect(nwBefore.agreedTotalMinor).toBe(150000); // agreement untouched before approval

    const r = await decideApproval(db, businessId, userId, approval.approvalId, "approve");
    expect(r.status).toBe("executed");
    const [nwAfter] = await db.select().from(commitments).where(eq(commitments.id, nwBefore.id));
    expect(nwAfter.agreedTotalMinor).toBe(150000 + 120000); // 12h × $100
    expect(nwAfter.currentVersion).toBe(2);
    const ms = await db.select().from(milestones).where(and(eq(milestones.commitmentId, nwBefore.id), eq(milestones.kind, "change_order")));
    expect(ms.map((m) => m.amountMinor)).toEqual([120000]);
  });

  it("ScopeWatch does not duplicate a change order that is already pending", async () => {
    // the seeded demo already has a pending change order for Team, Gallery and FAQ pages
    const ev = await run("Northwind asked for a Team page, a Gallery and an FAQ. Check the scope.");
    expect(ev.find((e) => e.type === "tool_result" && /Already covered/.test(e.summary))).toBeTruthy();
    expect(ev.find((e) => e.type === "approval")).toBeUndefined();
  });

  it("approvals cannot be executed twice", async () => {
    const [done] = await db.select().from(approvals).where(and(eq(approvals.businessId, businessId), eq(approvals.status, "executed")));
    await expect(decideApproval(db, businessId, userId, done.id, "approve")).rejects.toThrow(/already decided/);
  });

  it("TrustGate denies a tool when the business blocks it", async () => {
    await db.update(agentPermissions).set({ policy: "deny" }).where(and(eq(agentPermissions.businessId, businessId), eq(agentPermissions.tool, "finance.summary")));
    const ev = await run("Give me a briefing on my business");
    expect(ev.find((e) => e.type === "tool_call")).toMatchObject({ tool: "business_summary", decision: "denied" });
    const denied = await db.select().from(agentToolCalls).where(and(eq(agentToolCalls.businessId, businessId), eq(agentToolCalls.decision, "denied")));
    expect(denied.length).toBeGreaterThan(0);
  });

  it("locked financial tools cannot be relaxed below approval", async () => {
    const { effectivePolicy } = await import("@/server/agents/policies");
    expect(effectivePolicy("change_orders.apply", "allow")).toBe("approval");
    expect(effectivePolicy("paypal.capture_order", "allow")).toBe("approval");
    expect(effectivePolicy("not.a.tool", "allow")).toBe("deny");
  });
});
