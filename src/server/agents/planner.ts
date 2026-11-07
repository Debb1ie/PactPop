/**
 * Rule-based planner, used when no AI key is configured. It routes a command to a fixed plan of
 * tool calls (the same tools and the same TrustGate checks Claude uses) and writes a plain summary.
 * It is labelled "Rule-based mode" in the UI and never pretends to be AI.
 */
import { analyzeRequestText, analyzeScopeText, detectFeatures, detectPageCount, detectPageNames } from "./extract";
import type { AgentName } from "./tools";
import { DEFAULT_PRICING_RULES } from "@/server/services/pricing";

type Call = (name: string, input: unknown, reasoning?: string) => Promise<unknown>;
type Say = (agent: AgentName, text: string) => void;
type Ctx = { call: Call; say: Say };

type Row = Record<string, unknown>;
const arr = (x: unknown) => (Array.isArray(x) ? (x as Row[]) : []);
const s = (x: unknown) => (typeof x === "string" ? x : "");

function mentioned(input: string, ...candidates: string[]) {
  const lower = input.toLowerCase();
  return candidates.some((c) => c && c.split(/\s+/).some((w) => w.length > 3 && lower.includes(w.toLowerCase())));
}

/** Text the client asked for: quoted text, or what follows "asked for/wants/requested". */
function clientAsk(input: string) {
  const q = /["“](.+?)["”]/.exec(input);
  if (q) return q[1];
  const m = /(?:asked for|asks for|wants|requested|requesting|would like|said)\s+(.+)$/i.exec(input);
  return m ? m[1] : input;
}

export async function planHeuristic(input: string, ctx: Ctx): Promise<string> {
  const t = input.toLowerCase();

  if (/scope|outside|extra|additional|change order|also (want|wants|asked|add)|asked for|wants|booking|gallery|more pages/.test(t)) return scopeFlow(input, ctx);
  if (/propos|draft|quote|price/.test(t)) return proposalFlow(input, ctx);
  if (/analy[sz]e|intake|new request|enquir|inquir|lead/.test(t)) return intakeFlow(input, ctx);
  if (/approv|waiting|pending|decision|sign.?off/.test(t)) return approvalsFlow(ctx);
  if (/client|customer/.test(t) && !/summar/.test(t)) {
    const rows = arr(await ctx.call("list_clients", {}));
    return rows.length
      ? `You have ${rows.length} clients:\n${rows.map((c) => `• ${s(c.name)}${c.company ? ` (${s(c.company)})` : ""}: ${s(c.outstanding)} outstanding, ${s(c.paid)} paid`).join("\n")}`
      : "You don't have any clients yet.";
  }
  return briefingFlow(input, ctx);
}

async function briefingFlow(input: string, { call, say }: Ctx) {
  say("Finance Agent", "Reading payments, invoices and commitments.");
  const snap = (await call("business_summary", {})) as Row | null;
  if (!snap) return "I couldn't read your business snapshot.";
  const approvals = arr(snap.pendingApprovals);
  const reqs = arr(snap.openRequests);
  const lines = [
    `Payments received: ${(Number(snap.receivedMinor) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} (only PayPal-confirmed payments count).`,
    `Outstanding: ${(Number(snap.outstandingMinor) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}${Number(snap.overdueCount) ? `, of which ${snap.overdueCount} invoice(s) are overdue` : ", nothing overdue"}.`,
    `${snap.activeCommitments} open commitment(s), ${(Number(snap.agreedMinor) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} under agreement.`,
  ];
  if (approvals.length) lines.push(`Waiting for you: ${approvals.map((a) => `${s(a.title)}${a.amount ? ` (${s(a.amount)})` : ""}`).join("; ")}.`);
  if (reqs.length) lines.push(`New requests to look at: ${reqs.map((r) => `${s(r.from)} (${s(r.status).replace("_", " ")})`).join(", ")}.`);
  if (/overdue|invoice/.test(input.toLowerCase()) && !Number(snap.overdueCount)) lines.unshift("No invoices are overdue.");
  return lines.join("\n");
}

async function approvalsFlow({ call }: Ctx) {
  const rows = arr(await call("list_approvals", {}));
  if (!rows.length) return "Nothing is waiting for your approval.";
  return `${rows.length} action(s) are waiting for your decision:\n${rows.map((a) => `• ${s(a.title)}${a.amount ? ` · ${s(a.amount)}` : ""}${a.client ? ` · ${s(a.client)}` : ""}\n  Why: ${s(a.reason)}`).join("\n")}\nYou can approve or reject them below.`;
}

async function pickRequest(input: string, call: Call, statuses: string[]) {
  const rows = arr(await call("list_requests", { status: statuses }));
  return rows.find((r) => mentioned(input, s(r.from))) ?? rows[0] ?? null;
}

async function intakeFlow(input: string, { call, say }: Ctx) {
  say("Intake Agent", "Looking for requests that haven't been analysed yet.");
  const req = await pickRequest(input, call, ["new", "needs_info"]);
  if (!req) return "There are no new requests to analyse.";
  const detail = (await call("get_request", { requestId: req.id })) as Row | null;
  if (!detail) return "I couldn't open that request.";
  say("Intake Agent", `Extracting requirements from ${s(detail.from)}'s message. Only facts that are stated count; gaps become questions.`);
  const a = analyzeRequestText(s(detail.clientMessage));
  await call("save_request_analysis", { requestId: req.id, ...a }, `Extracted from ${s(detail.from)}'s message.`);
  let priceLine = "";
  if (a.estimate.pages || a.estimate.features.length) {
    say("Pricing Agent", "Pricing the stated units with your rate card.");
    const q = (await call("quote_project", a.estimate)) as Row | null;
    if (q) priceLine = `\nAt your rates, that scope comes to ${s(q.total)}.`;
  }
  return [
    `I analysed ${s(detail.from)}'s request: ${a.summary}`,
    a.requirements.length ? `Requirements: ${a.requirements.join(", ")}.` : "",
    a.timelineDays ? `Timeline: about ${a.timelineDays} days.` : "",
    a.followUpQuestions.length ? `Before quoting firmly, ask:\n${a.followUpQuestions.map((q) => `• ${q}`).join("\n")}` : "",
    priceLine,
  ]
    .filter(Boolean)
    .join("\n");
}

async function proposalFlow(input: string, ctx: Ctx) {
  const { call, say } = ctx;
  let req = await pickRequest(input, call, ["analyzed", "needs_info", "new"]);
  if (!req) return "There's no open request to write a proposal for.";
  let detail = (await call("get_request", { requestId: req.id })) as Row | null;
  if (!detail) return "I couldn't open that request.";
  if (!detail.analysis) {
    await intakeFlow(s(detail.from), ctx);
    req = await pickRequest(s(detail.from), call, ["analyzed", "needs_info"]);
    detail = req ? ((await call("get_request", { requestId: req.id })) as Row | null) : null;
    if (!detail?.analysis) return "I couldn't analyse that request well enough to draft a proposal.";
  }
  const a = detail.analysis as ReturnType<typeof analyzeRequestText>;
  if (!a.estimate.pages && !a.estimate.features.length) return `${s(detail.from)}'s request doesn't state enough scope to price yet. Ask: ${a.followUpQuestions.join(" ")}`;
  say("Proposal Agent", "Writing scope, exclusions and acceptance criteria. The pricing engine sets the amounts.");
  const scopeItems = [
    ...(a.deliverables.length ? [{ title: `${a.estimate.pages} designed pages`, detail: a.deliverables.join(", ") }] : a.estimate.pages ? [{ title: `${a.estimate.pages} designed pages` }] : []),
    ...a.estimate.features.map((f) => ({ title: f[0].toUpperCase() + f.slice(1) })),
  ];
  const r = (await call(
    "draft_proposal",
    {
      requestId: req.id,
      title: `${s(detail.from)}: ${a.projectType}`,
      summary: `${a.summary} Delivered in about ${a.timelineDays ?? 21} days.`,
      scopeItems,
      exclusions: ["Hosting and domain fees", "Photography", "Work not listed in the scope"],
      acceptanceCriteria: [...scopeItems.map((x) => `${x.title} delivered and reviewed`), "Works on mobile and desktop"].slice(0, 8),
      estimate: a.estimate,
      timelineDays: a.timelineDays ?? 21,
    },
    `Drafted from the analysed request from ${s(detail.from)}.`,
  )) as Row | null;
  if (!r) return "The proposal draft failed. Check the request details.";
  const out = [`I drafted a proposal for ${s(detail.from)}: ${s(r.total)} total, ${arr(r.milestones).map((m) => `${s(m.title)} ${s(m.amount)}`).join(" + ")}.`];
  if (/send/.test(input.toLowerCase())) {
    await call("send_proposal", { proposalId: r.proposalId }, `Proposal for ${s(detail.from)} is ready to send.`);
    out.push("Sending it to the client needs your approval, so it's waiting in your queue.");
  } else out.push("It's saved as a draft. Ask me to send it when you're happy, and I'll queue it for your approval.");
  return out.join("\n");
}

async function scopeFlow(input: string, { call, say }: Ctx) {
  say("Scope Agent", "Finding the agreement this request belongs to.");
  const all = arr(await call("find_commitments", {}));
  const active = all.filter((c) => !["draft", "cancelled", "completed"].includes(s(c.status)));
  const c = active.find((x) => mentioned(input, s(x.client), s(x.title))) ?? active[0];
  if (!c) return "I couldn't find an active agreement to compare this request with.";
  const detail = (await call("get_commitment", { commitmentId: c.id })) as Row | null;
  if (!detail) return "I couldn't read that agreement.";
  const scope = arr(detail.scope);
  const scopeText = scope.map((x) => `${s(x.title)} ${s(x.detail)}`).join(". ");
  const pageNames = scope.flatMap((x) => (s(x.detail).includes(",") ? s(x.detail).split(",").map((p) => p.trim()) : []));
  const pageCount = scope.map((x) => detectPageCount(s(x.title)) ?? 0).reduce((a, b) => a + b, 0) || pageNames.length;
  const ask = clientAsk(input);
  say("Scope Agent", `Comparing “${ask.slice(0, 120)}” with v${detail.version} of the agreement (${pageCount} pages${detectPageNames(scopeText).length ? "" : ""}).`);
  const { classification, additions } = analyzeScopeText(ask, { pageNames, pageCount, features: detectFeatures(scopeText) }, DEFAULT_PRICING_RULES.featureHours);
  const summary = additions.length
    ? `${additions.map((a) => a.item).join(", ")} ${additions.length === 1 ? "is" : "are"} outside the accepted ${pageCount}-page scope.`
    : `This request fits the accepted scope (${classification}).`;
  const r = (await call(
    "check_scope",
    { commitmentId: c.id, requestText: ask, classification, additions, summary },
    `${summary} Priced with your rates (additional pages at the additional-page rate, features at catalogue hours).`,
  )) as Row | null;
  if (!r) return "ScopeWatch couldn't record this comparison.";
  if (r.duplicateOf) return `ScopeWatch: ${summary}
A change order for exactly these items (${s(r.amount)}) is already waiting for your approval, so I didn't create a duplicate.`;
  if (!r.changeOrderId) return `ScopeWatch: ${summary} No change order is needed.`;
  return `ScopeWatch: ${summary}\nI drafted a change order for ${s(r.amount)} (${arr(r.breakdown).map((l) => `${s(l.label)}: ${s(l.total)}`).join("; ")}). The agreement isn't changed until you approve it below.`;
}
