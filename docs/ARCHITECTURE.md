# PactPop — Architecture & Implementation Plan

> Status: living document. Decisions are logged in [DECISIONS.md](DECISIONS.md).

## 1. Repository assessment (2026-11-07)

- Repository was **empty** (greenfield). No existing code, conventions, or docs to preserve.
- Toolchain: Node 22.23, npm 10.9, git 2.47, Docker 29 installed (daemon not running at inspection time).
- No local PostgreSQL install → local dev uses embedded **PGlite** (real Postgres compiled to WASM) by default; any real Postgres (Docker, Render, Neon) works via `DATABASE_URL`.
- Risks found: none inherited. Greenfield risks are scope (very large brief) and external dependencies (PayPal sandbox credentials, AI API key, public webhook URL).

## 2. Recommended architecture

A single **Next.js (App Router) + TypeScript** deployable. Server code is organised as plain TypeScript modules with no React imports, so business logic is independent of presentation and testable in isolation.

```
Browser ──► Next.js pages (RSC + client components)
              │
              ▼
        Route handlers / server actions  ── auth + tenant guard + zod validation + rate limit
              │
              ▼
   ┌──────────── domain services (src/server/services) ─────────────┐
   │ clients · requests · proposals · commitments · deliverables   │
   │ scope · billing · approvals · evidence · finance · audit      │
   └──────┬───────────────────────────┬────────────────────────────┘
          │                           │
          ▼                           ▼
  Agent orchestrator            PayPal gateway (src/server/paypal)
  (src/server/agents)           OAuth token cache · Orders v2 · Invoicing v2
   roles · tool registry        webhook signature verification
   TrustGate permission check   idempotency (PayPal-Request-Id)
   LLM provider abstraction            │
          │                            ▼
          ▼                     PayPal Sandbox REST API
   Anthropic / (OpenAI) / heuristic
              │
              ▼
        Drizzle ORM ──► PostgreSQL (PGlite locally, managed PG in prod)
```

Key rule: **agents never call PayPal directly.** An agent invokes a registered tool → TrustGate decides (allow / require approval / deny) → the tool calls a domain service → the service calls the PayPal gateway. Amounts always come from database records (milestones, approved change orders), never from model text.

## 3. Module structure

```
src/
  app/
    (marketing)/          landing, features, how-it-works
    (auth)/               login, register
    request/[slug]/       public customer project-request portal
    accept/[token]/       customer proposal acceptance + payment page
    app/                  authenticated business app
      dashboard/ command/ commitments/[id]/ clients/[id]/ proposals/[id]/
      deliverables/ payments/ approvals/ evidence/ agents/ reports/ settings/
    api/
      agents/command/     command-center endpoint
      paypal/webhook/     verified webhook receiver
      ...                 JSON routes where server actions don't fit
  components/
    brand/                logo, wordmark, icon
    ui/                   shadcn-style primitives
    app/                  shell, nav, timeline, vowgraph, grids, charts
  lib/                    client-safe utils (money formatting, cn, status maps)
  server/
    db/                   schema.ts, client.ts, migrations, seed.ts
    auth/                 password hashing, sessions, guards
    services/             domain logic (one file per bounded context)
    agents/               orchestrator, roles, tools, trustgate, providers
    paypal/               client, orders, invoices, webhooks
    security/             rate limit, sanitisation, upload validation
tests/                    vitest unit + integration, playwright e2e
docs/                     architecture, agents, paypal, security, decisions, devlog
```

## 4. Database design (PostgreSQL, Drizzle)

Money: `bigint`-safe **integer minor units** (`amount_minor`) + `currency` (ISO 4217). All arithmetic in integers. External PayPal IDs are stored in dedicated columns with unique constraints, separate from internal UUID primary keys. Every table has `created_at`; mutable tables have `updated_at`. Every tenant-owned table has `business_id` (indexed) and every query is scoped by it.

| Table | Purpose / notable columns |
|---|---|
| users | email (unique), password_hash, name |
| sessions | token_hash (unique), user_id, expires_at |
| businesses | name, slug (unique, used by public intake portal), currency, hourly_rate_minor, pricing rules (jsonb), branding |
| business_members | business_id + user_id (unique), role: owner/admin/member |
| clients | contact, company, notes, is_demo |
| project_requests | raw text, source (portal/manual/agent), extracted jsonb (type, requirements, deliverables, budget, timeline, constraints, missing_info), status |
| proposals | request_id, client_id, title, summary, scope_items jsonb, total_minor, milestones draft, status, owner_approved_at, accept_token_hash, accepted_at, accepted_by_name |
| commitments | client_id, proposal_id, title, status (11-state enum), agreed_total_minor, payment_terms, current_version |
| commitment_versions | commitment_id + version (unique), scope snapshot jsonb, total_minor, reason, change_order_id |
| milestones | commitment_id, title, amount_minor, due_date, kind (deposit/milestone/final/change_order), status |
| deliverables | commitment_id, milestone_id, title, acceptance_criteria jsonb, status |
| evidence_files | deliverable_id?, commitment_id, kind (file/url/note), storage key, sha256, mime, size |
| scope_changes | commitment_id, request text, analysis jsonb (additions, rationale), status |
| change_orders | scope_change_id, commitment_id, items jsonb, amount_minor, status, approved_by, approved_at |
| invoices | milestone_id, paypal_invoice_id (unique), status, amount_minor, payer_view_url, is_sandbox |
| payments | invoice_id? / paypal_order_id (unique), capture_id (unique), status, amount_minor, verified_via (webhook/api) |
| payment_events | paypal_event_id (**unique** → idempotency), event_type, payload jsonb, signature_verified, processed_at |
| approvals | action_type, payload jsonb, amount_minor, reasoning_summary, requested_by (agent execution), status, decided_by, decided_at |
| agent_executions | role, input, status, output jsonb, model, tokens, error, conversation_id |
| agent_tool_calls | execution_id, tool, args jsonb, decision (allowed/approval_required/denied), result jsonb |
| agent_permissions | business_id + tool (unique), policy (allow/approval/deny) |
| audit_logs | actor (user/agent/system/paypal), action, entity, entity_id, before/after jsonb |
| notifications | user_id, kind, title, link, read_at |
| timeline_events | commitment_id, kind, ref entity/id, summary — powers Commitment Timeline, VowGraph and Evidence Vault |

`transactions` from the brief is covered by `payments` + `payment_events` (a separate table would duplicate data). VowGraph is derived from real foreign keys: request → proposal → commitment → milestones/deliverables → evidence/approvals → invoices/payments, plus scope_changes → change_orders → commitment_versions.

## 5. Agent architecture

One capable model, seven **roles** (Intake, Scope, Pricing, Proposal, Payment, Finance, Operations) plus an **Orchestrator** that routes a command to a role. Each role is a system prompt + an allow-list of tools. Tools are registered once with a zod input schema, a handler, and a `permission` key.

Execution loop: orchestrator classifies intent (answer / prepare / execute / needs approval) → runs the role with tool-use → every tool call goes through `TrustGate.check(businessId, tool, args)` → result is `allowed` (handler runs), `approval_required` (an `approvals` row is created with the reasoning summary; nothing executes), or `denied`. All of it is persisted to `agent_executions` / `agent_tool_calls`, so a run is auditable and resumable.

- Providers: Groq (OpenAI-compatible, default, free tier) and Anthropic Claude, chosen by `AI_PROVIDER`. Both loops share the same tool registry, validation and TrustGate (`src/server/agents/orchestrator.ts`).
- Pricing is **deterministic code** (business rates × estimated units + rules). The model may *propose* units; the service computes the price and explains it.
- Prompt-injection posture: customer text is passed as quoted data, never as instructions; tool permissions are server-side config the model cannot change; no tool exists that edits permissions.
- Without an AI key the app runs a clearly labelled **heuristic mode** (rule-based extraction/comparison) so the workflow can still be demonstrated. It is never presented as AI output.

## 6. PayPal integration strategy

**Built and tested in the Sandbox (live on Vercel):**

- Typed REST client (`src/server/paypal/client.ts`) against `https://api-m.sandbox.paypal.com`: OAuth2 client credentials with token caching.
- **Invoicing v2** (`invoices.ts`): create + send an invoice for one milestone (amount from the milestone row), then confirm status with a server-side GET.
- **Orders v2** (`orders.ts`): the client checkout creates an order for a due milestone and captures it on the server after the payer approves in PayPal's window; money is recorded from PayPal's capture response.
- **Webhooks** (`webhooks.ts`, `/api/paypal/webhook`): signature verified with `/v1/notifications/verify-webhook-signature`; only verified events are stored; `INVOICING.INVOICE.PAID` and `PAYMENT.CAPTURE.COMPLETED` trigger a re-read from PayPal before anything is recorded.
- Every mutating call sends a `PayPal-Request-Id` derived from our internal record ID → retries are idempotent.
- Webhook receiver: verify signature with PayPal → insert into `payment_events` (unique `paypal_event_id` makes duplicates no-ops) → update invoice/payment → timeline + audit → notify Finance Agent summary.
- Payment confirmed **only** by a verified webhook or a server-side GET of the order/invoice from PayPal. Frontend redirects only trigger a server-side re-check.
- Localhost cannot receive webhooks; locally the **Check** button (server-side API reconciliation) confirms payments. The deployed site (`https://pact-pop.vercel.app`) receives webhooks.
- PayPal Agent Toolkit / MCP server: evaluated as a development-time aid. Runtime uses our own gateway because we need idempotency keys, amount validation and audit around each call.

## 7. Security model

Session auth (bcrypt password hash, random token stored hashed, httpOnly SameSite=Lax cookie) · role-based membership · tenant scoping in every service function · zod validation on all inputs and on all model outputs · rate limiting on auth, intake portal and agent endpoints · uploads: size/MIME allow-list, sha256, stored outside public dir · secrets only in server env, never `NEXT_PUBLIC_*` · webhook signature verification · audit log for all sensitive actions · CSRF: same-site cookies + origin check on mutating routes.

## 8. Prioritised implementation plan

1. **Foundation** — scaffold, design system + logo, DB schema/migrations/seed, auth, app shell, dashboard, clients.
2. **Core workflow (no AI yet)** — requests, proposals, commitments + timeline, milestones, approvals center, customer accept page.
3. **Agents** — provider abstraction, tool registry, TrustGate, orchestrator, Intake/Scope/Pricing/Proposal roles, Command Center.
4. **PayPal** — gateway, invoice for deposit, checkout order, webhook, reconciliation, Payments page; Payment & Finance agents.
5. **ScopeWatch + ProofFlow + Evidence Vault + VowGraph.**
6. **Reports, Settings, Agents page, polish, tests, deploy config, docs.**

The demo scenario (website redesign, $750 deposit, $300 change order) is the acceptance test for steps 1–5.

**Status (2026-11-08):** steps 1–6 are built. Hosting is Vercel (serverless Next.js) with Neon Postgres; local development uses embedded PGlite.

## 9. Critical risks & dependencies

| Risk | Mitigation |
|---|---|
| No PayPal sandbox credentials | App detects missing config, disables PayPal actions with a setup guide; never simulates success |
| Webhooks unreachable on localhost | Tunnel instructions + server-side API reconciliation |
| No AI key | Labelled heuristic mode |
| Brief scope vs. hackathon time | Complete vertical workflow first; smaller-but-real versions of secondary features |
| LLM returns wrong numbers | Pricing in code; amounts read from DB; zod-validated outputs |
| Prompt injection via client text | Data/instruction separation, server-side TrustGate, no permission-editing tools |
