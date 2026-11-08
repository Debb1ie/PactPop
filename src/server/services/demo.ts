/**
 * Demo workspace provisioning (shared by `npm run db:seed` and the "Try the demo" button).
 *
 * Every row is flagged is_demo and labelled DEMO in the UI. Deliberately NOT created:
 * invoices, payments or PayPal events. Payment data only ever comes from the PayPal Sandbox,
 * so the demo shows $0 received until a real sandbox payment is made.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { Database } from "@/server/db/create";
import {
  approvals,
  businesses,
  changeOrders,
  clients,
  commitments,
  commitmentVersions,
  deliverables,
  evidenceFiles,
  invoices,
  milestones,
  paymentEvents,
  payments,
  projectRequests,
  proposals,
  scopeChanges,
  timelineEvents,
  users,
} from "@/server/db/schema";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";
import { createAccount } from "./accounts";
import { DEFAULT_PRICING_RULES, planMilestones, quoteChangeOrder, quoteProject } from "./pricing";

const DAY = 86_400_000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * DAY - hours * 3_600_000);

export async function demoUserExists(db: Database) {
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_EMAIL)).limit(1);
  return Boolean(u);
}

/** Removes any existing demo workspace and builds a fresh one. */
export async function resetDemoWorkspace(db: Database) {
  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL));
  if (existing) {
    const [biz] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, "lumen-studio"));
    if (biz) {
      // Invoices restrict deleting their agreements, so money rows go first.
      await db.delete(paymentEvents).where(eq(paymentEvents.businessId, biz.id));
      await db.delete(payments).where(eq(payments.businessId, biz.id));
      await db.delete(invoices).where(eq(invoices.businessId, biz.id));
    }
    await db.delete(businesses).where(eq(businesses.slug, "lumen-studio"));
    await db.delete(users).where(eq(users.id, existing.id));
  }
  return createDemoWorkspace(db);
}

export async function createDemoWorkspace(db: Database) {
  const { user, business } = await createAccount(db, {
    name: "Maya Santos",
    email: DEMO_EMAIL,
    passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
    businessName: "Lumen Studio",
    isDemo: true,
  });
  const b = business.id;
  const rules = DEFAULT_PRICING_RULES;

  const [northwind, kitefly, becker, sora] = await db
    .insert(clients)
    .values([
      {
        businessId: b,
        name: "Daniel Reyes",
        email: "daniel@northwind-bakery.example",
        company: "Northwind Bakery",
        phone: "+1 555 0142",
        website: "https://northwind-bakery.example",
        notes: "Prefers email. Wants the site live before the spring menu launch.",
        isDemo: true,
        createdAt: ago(16),
      },
      { businessId: b, name: "Priya Natarajan", email: "priya@kitefly.example", company: "Kitefly Tours", isDemo: true, createdAt: ago(2) },
      { businessId: b, name: "Tom Becker", email: "tom@beckerlaw.example", company: "Becker Legal", notes: "Decision maker is Tom; partner sign-off needed over $2k.", isDemo: true, createdAt: ago(9) },
      { businessId: b, name: "Aiko Tanaka", email: "aiko@soraceramics.example", company: "Sora Ceramics", isDemo: true, createdAt: ago(4) },
    ])
    .returning();

  // ── 1. Northwind Bakery: the hero scenario ($1,500 redesign, now with a $300 scope change) ──
  const nwQuote = quoteProject({ pages: 5, features: ["responsive design", "basic seo"], extraHours: 0 }, rules);
  const nwPlan = planMilestones(nwQuote.totalMinor, rules, 14);
  const nwScope = [
    { title: "5 designed pages", detail: "Home, Menu, About, Catering, Contact" },
    { title: "Responsive design", detail: "Optimised for phones and tablets" },
    { title: "Basic SEO", detail: "Titles, meta descriptions, local business schema" },
  ];

  const [nwRequest] = await db
    .insert(projectRequests)
    .values({
      businessId: b,
      clientId: northwind.id,
      contactName: "Daniel Reyes",
      contactEmail: "daniel@northwind-bakery.example",
      company: "Northwind Bakery",
      rawText:
        "Hi! We need our bakery website redesigned before our spring menu launch. We're thinking 5 pages: Home, Menu, About, Catering and Contact. " +
        "It has to look great on phones since most customers find us on mobile, and we'd like basic SEO so we show up for 'bakery near me'. " +
        "Our budget is around $1,500 and we'd love it done in two weeks.",
      statedBudgetMinor: 150000,
      statedDeadline: "2 weeks",
      source: "portal",
      status: "converted",
      extracted: {
        projectType: "Website redesign",
        summary: "Five-page, mobile-first bakery website with basic local SEO.",
        requirements: ["5 pages", "Mobile-friendly", "Basic SEO"],
        deliverables: ["Home", "Menu", "About", "Catering", "Contact"],
        budgetMinor: 150000,
        timelineDays: 14,
        constraints: ["Live before spring menu launch"],
        missingInfo: ["Who supplies photography and copy?"],
        followUpQuestions: ["Will you provide menu photos, or should we arrange a shoot?"],
        estimate: { pages: 5, features: ["responsive design", "basic seo"], extraHours: 0 },
        analyzedBy: "heuristic",
      },
      isDemo: true,
      createdAt: ago(15),
    })
    .returning();

  const [nwProposal] = await db
    .insert(proposals)
    .values({
      businessId: b,
      requestId: nwRequest.id,
      clientId: northwind.id,
      title: "Northwind Bakery website redesign",
      summary: "A five-page, mobile-first website with basic local SEO, delivered in two weeks.",
      scopeItems: nwScope,
      exclusions: ["Photography", "Online ordering", "Copywriting beyond page headings"],
      acceptanceCriteria: ["All 5 pages live on staging", "Passes mobile layout review", "Meta titles and descriptions on every page"],
      pricing: nwQuote.breakdown,
      totalMinor: nwQuote.totalMinor,
      milestonePlan: nwPlan,
      timelineDays: 14,
      paymentTerms: "50% deposit on acceptance, 50% on final delivery.",
      status: "accepted",
      ownerApprovedAt: ago(14),
      ownerApprovedBy: user.id,
      acceptedAt: ago(13),
      acceptedByName: "Daniel Reyes",
      generatedBy: "agent",
      isDemo: true,
      createdAt: ago(14, 6),
    })
    .returning();

  const [nw] = await db
    .insert(commitments)
    .values({
      businessId: b,
      clientId: northwind.id,
      proposalId: nwProposal.id,
      title: "Website redesign",
      description: "Five-page, mobile-first bakery website with basic SEO.",
      status: "in_progress",
      agreedTotalMinor: nwQuote.totalMinor,
      paymentTerms: "50% deposit on acceptance, 50% on final delivery.",
      startDate: ago(13),
      dueDate: new Date(Date.now() + 1 * DAY),
      isDemo: true,
      createdAt: ago(13),
    })
    .returning();

  await db.insert(commitmentVersions).values({
    businessId: b,
    commitmentId: nw.id,
    version: 1,
    scopeItems: nwScope,
    exclusions: ["Photography", "Online ordering"],
    totalMinor: nwQuote.totalMinor,
    reason: "Accepted proposal",
    createdBy: user.id,
    createdAt: ago(13),
  });

  const nwMilestones = await db
    .insert(milestones)
    .values(
      nwPlan.map((m, i) => ({
        businessId: b,
        commitmentId: nw.id,
        title: m.title,
        kind: m.kind,
        amountMinor: m.amountMinor,
        position: i,
        dueDate: new Date(ago(13).getTime() + m.dueInDays * DAY),
        status: "pending" as const,
      })),
    )
    .returning();

  // ProofFlow: two deliverables already checked; one has fresh proof waiting for the ProofFlow Agent.
  const checked = (criteria: string[], summary: string) => ({ verified: criteria, missing: [], issues: [], suggestions: [], summary, analyzedBy: "ai" as const, analyzedAt: ago(5).toISOString() });
  const [nwDel] = await db
    .insert(deliverables)
    .values([
      {
        businessId: b,
        commitmentId: nw.id,
        milestoneId: nwMilestones[1]?.id,
        title: "Home, Menu and About pages",
        acceptanceCriteria: ["Live on staging", "Mobile layout review passed"],
        status: "submitted",
        submissionNotes: "Home, Menu and About are live on staging. Mobile layout review done on iPhone 13 and Pixel 7: no layout issues found.",
        createdAt: ago(4),
      },
      { businessId: b, commitmentId: nw.id, milestoneId: nwMilestones[1]?.id, title: "Catering and Contact pages", acceptanceCriteria: ["Live on staging", "Contact form tested"], status: "verified", submissionNotes: "Both pages on staging; test submission received at the bakery inbox.", verification: checked(["Live on staging", "Contact form tested"], "Both pages are on staging and the contact form delivered a test message."), createdAt: ago(9) },
      { businessId: b, commitmentId: nw.id, milestoneId: nwMilestones[1]?.id, title: "Basic SEO", acceptanceCriteria: ["Meta titles and descriptions on every page", "Local business schema"], status: "verified", submissionNotes: "Meta tags on all pages; LocalBusiness schema validated.", verification: checked(["Meta titles and descriptions on every page", "Local business schema"], "Every page has a title and description; schema validates."), createdAt: ago(8) },
    ])
    .returning();
  await db.insert(evidenceFiles).values([
    { businessId: b, commitmentId: nw.id, deliverableId: nwDel.id, kind: "url", label: "staging.northwind-bakery.example", url: "https://staging.northwind-bakery.example", createdAt: ago(4) },
    { businessId: b, commitmentId: nw.id, deliverableId: nwDel.id, kind: "note", label: "Mobile review", note: "Checked Home, Menu and About on iPhone 13 (Safari) and Pixel 7 (Chrome): navigation, menu cards and images fit the screen, no horizontal scrolling.", createdAt: ago(4) },
  ]);

  // ScopeWatch: the client asks for 3 more pages → $300 change order waiting for approval
  const coQuote = quoteChangeOrder({ pages: 3, hours: 0 }, rules);
  const [scope] = await db
    .insert(scopeChanges)
    .values({
      businessId: b,
      commitmentId: nw.id,
      requestText: "Could we also add a Team page, a Gallery and an FAQ? Should be quick since the design is done.",
      baselineVersion: 1,
      status: "change_order_proposed",
      analysis: {
        withinScope: [],
        additions: [
          { item: "Team page", rationale: "Not among the 5 agreed pages.", estimatedHours: 2, pages: 1 },
          { item: "Gallery page", rationale: "Not among the 5 agreed pages.", estimatedHours: 2, pages: 1 },
          { item: "FAQ page", rationale: "Not among the 5 agreed pages.", estimatedHours: 2, pages: 1 },
        ],
        summary: "Three new pages outside the accepted 5-page scope. They reuse the agreed design system, so they're priced at the additional-page rate.",
        analyzedBy: "heuristic",
      },
      createdAt: ago(1, 5),
    })
    .returning();
  const [co] = await db
    .insert(changeOrders)
    .values({
      businessId: b,
      commitmentId: nw.id,
      scopeChangeId: scope.id,
      title: "3 additional pages",
      items: [{ title: "Team page" }, { title: "Gallery page" }, { title: "FAQ page" }],
      pricing: coQuote.breakdown,
      amountMinor: coQuote.totalMinor,
      status: "pending_owner_approval",
      createdAt: ago(1, 5),
    })
    .returning();
  await db.insert(approvals).values({
    businessId: b,
    actionType: "change_orders.apply",
    title: "Approve change order: 3 additional pages",
    payload: { changeOrderId: co.id, commitmentId: nw.id },
    amountMinor: co.amountMinor,
    currency: "USD",
    commitmentId: nw.id,
    clientId: northwind.id,
    reasoningSummary:
      "The client asked for Team, Gallery and FAQ pages. The accepted agreement covers 5 pages, so these are new work. Priced at 3 × $100 (additional-page rate) = $300.00.",
    status: "pending",
    createdAt: ago(1, 5),
  });

  // ── 2. Becker Legal: proposal sent, waiting for the client ──
  const bkQuote = quoteProject({ pages: 6, features: ["responsive design", "cms integration", "basic seo"], extraHours: 2 }, rules);
  const [bkProposal] = await db
    .insert(proposals)
    .values({
      businessId: b,
      clientId: becker.id,
      title: "Becker Legal website & CMS",
      summary: "Six-page site with a CMS so the team can publish legal updates.",
      scopeItems: [{ title: "6 designed pages" }, { title: "CMS integration" }, { title: "Responsive design" }, { title: "Basic SEO" }],
      pricing: bkQuote.breakdown,
      totalMinor: bkQuote.totalMinor,
      milestonePlan: planMilestones(bkQuote.totalMinor, rules, 21),
      timelineDays: 21,
      paymentTerms: "50% deposit on acceptance, 50% on final delivery.",
      status: "sent",
      ownerApprovedAt: ago(3),
      ownerApprovedBy: user.id,
      generatedBy: "agent",
      isDemo: true,
      createdAt: ago(3),
    })
    .returning();
  const [bk] = await db
    .insert(commitments)
    .values({
      businessId: b,
      clientId: becker.id,
      proposalId: bkProposal.id,
      title: "Website & CMS",
      description: "Six-page site with CMS for legal updates.",
      status: "awaiting_acceptance",
      agreedTotalMinor: bkQuote.totalMinor,
      paymentTerms: "50% deposit on acceptance, 50% on final delivery.",
      isDemo: true,
      createdAt: ago(3),
    })
    .returning();

  // ── 3. Kitefly Tours: brand-new request waiting for analysis ──
  await db.insert(projectRequests).values({
    businessId: b,
    clientId: kitefly.id,
    contactName: "Priya Natarajan",
    contactEmail: "priya@kitefly.example",
    company: "Kitefly Tours",
    rawText:
      "We run kite-surfing tours and need a site where people can see our trips and book a lesson. Maybe 4 pages plus booking. Budget is flexible, ideally live within a month.",
    statedDeadline: "1 month",
    source: "portal",
    status: "new",
    isDemo: true,
    createdAt: ago(0, 3),
  });

  // ── 4. Sora Ceramics: draft commitment ──
  const soQuote = quoteProject({ pages: 3, features: ["e-commerce"], extraHours: 0 }, rules);
  await db.insert(commitments).values({
    businessId: b,
    clientId: sora.id,
    title: "Online shop starter",
    description: "Three pages plus a small product catalogue.",
    status: "draft",
    agreedTotalMinor: soQuote.totalMinor,
    paymentTerms: "50% deposit on acceptance, 50% on final delivery.",
    isDemo: true,
    createdAt: ago(4),
  });

  // ── Timeline (feeds Recent activity, Evidence Vault and VowGraph) ──
  const agent = (label: string) => ({ actorType: "agent" as const, actorLabel: label });
  const you = { actorType: "user" as const, actorLabel: "Maya Santos" };
  const client = (name: string) => ({ actorType: "client" as const, actorLabel: name });
  await db.insert(timelineEvents).values([
    { businessId: b, commitmentId: nw.id, kind: "request.received", title: "Project request received", refType: "project_request", refId: nwRequest.id, ...client("Daniel Reyes"), createdAt: ago(15) },
    { businessId: b, commitmentId: nw.id, kind: "request.analyzed", title: "Requirements extracted (5 pages, mobile, SEO)", refType: "project_request", refId: nwRequest.id, ...agent("Intake Agent"), createdAt: ago(15, -1) },
    { businessId: b, commitmentId: nw.id, kind: "proposal.drafted", title: "Proposal drafted from your rate card", refType: "proposal", refId: nwProposal.id, ...agent("Proposal Agent"), amountMinor: nwQuote.totalMinor, createdAt: ago(14, 6) },
    { businessId: b, commitmentId: nw.id, kind: "proposal.approved", title: "Proposal approved and sent", refType: "proposal", refId: nwProposal.id, ...you, amountMinor: nwQuote.totalMinor, createdAt: ago(14) },
    { businessId: b, commitmentId: nw.id, kind: "proposal.accepted", title: "Agreement accepted by client", refType: "proposal", refId: nwProposal.id, ...client("Daniel Reyes"), amountMinor: nwQuote.totalMinor, createdAt: ago(13) },
    { businessId: b, commitmentId: nw.id, kind: "deliverable.submitted", title: "Home, Menu and About pages submitted", refType: "deliverable", ...you, createdAt: ago(4) },
    { businessId: b, commitmentId: bk.id, kind: "proposal.approved", title: "Proposal sent to Becker Legal", refType: "proposal", refId: bkProposal.id, ...you, amountMinor: bkQuote.totalMinor, createdAt: ago(3) },
    { businessId: b, commitmentId: nw.id, kind: "scope.detected", title: "ScopeWatch: 3 pages outside agreed scope", refType: "scope_change", refId: scope.id, ...agent("Scope Agent"), createdAt: ago(1, 5) },
    { businessId: b, commitmentId: nw.id, kind: "change_order.drafted", title: "Change order drafted, waiting for your approval", refType: "change_order", refId: co.id, ...agent("Pricing Agent"), amountMinor: co.amountMinor, createdAt: ago(1, 4) },
  ]);

  return { user, business };
}
