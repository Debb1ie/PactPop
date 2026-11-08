# PactPop

**Make promises. Make progress. Get paid.**

PactPop is an AI-powered commercial operations platform for freelancers, consultants and small agencies. It connects the three stages every client engagement goes through:

1. **Agreement:** what was promised?
2. **Evidence:** was the promised work delivered?
3. **Payment:** is the financial commitment ready to be fulfilled, and has PayPal confirmed it?

Specialised AI agents read client requests, structure scope and pricing, catch scope creep, check delivered work against acceptance criteria, and prepare PayPal invoices. A permission layer called **TrustGate** ensures that sensitive financial actions always wait for a human.

> Built for the **PayPal AI Hackathon** (*Build What's Next with PayPal and AI*). Free and open source under the [MIT License](LICENSE). Runs against the **PayPal Sandbox** only, so no real money moves.

**Live demo:** [pact-pop.vercel.app](https://pact-pop.vercel.app). Open **Log in → Try the demo workspace**. Everything runs on the PayPal Sandbox; the demo data is labelled DEMO and can be reset in Settings → Workspace.

---

## Project status

PactPop is under active development. This table is kept honest: anything not marked *Working* is not implemented yet.

| Area | Status |
|---|---|
| Landing, features and how-it-works pages, revenue-leak calculator, product tour | ✅ Working |
| Registration / login (session auth), one-click demo login | ✅ Working |
| Dashboard (PayPal-confirmed metrics only), clients (list, search, create, edit, balances) | ✅ Working |
| Database schema for the whole workflow (24 tables), migrations, demo seed | ✅ Working |
| Deterministic pricing engine, exact money handling, TrustGate policy table | ✅ Working (unit-tested) |
| Light & dark themes, responsive layout with a mobile tab bar, scroll-reactive WebGL grid terrain | ✅ Working |
| VowGraph 3D view (commitments as glass orbs: milestones as rings, change orders as satellites) and 3D architecture diagram | ✅ Working (live data) |
| One-click demo workspace with sample commitments, scope change and approval; **Reset demo data** in Settings | ✅ Working |
| **Client request page** behind each business's request link (`/request/[slug]`) | ✅ Working |
| **One-link client checkout** (`/agreement/[token]`): client reviews scope, accepts by name, pays the deposit with PayPal Smart Buttons (Orders v2, server-side create + capture) | ✅ Working (tested in the Sandbox) |
| **AI Agents** chat page: live, streamed agent runs with every tool call and TrustGate decision visible | ✅ Working |
| **Settings**: editable TrustGate permissions (locked money controls), agent history, tools, workspace | ✅ Working |
| **Finance dashboard** (account position, cash flow, receivables, ledger), **Commitments** (table, VowGraph, activity) and **Payments** pages | ✅ Working |
| All 8 agents (Intake, Pricing, Proposal, Scope, Operations, Finance, ProofFlow, PayFlow) acting on real records through 18 tools | ✅ Working (Groq `openai/gpt-oss-120b` or Claude, set by `AI_PROVIDER`; labelled rule-based mode without a key) |
| **Approval Center** + inline approvals: approving a change order creates agreement v2 and a change-order milestone | ✅ Working |
| Agent briefing: next actions found in your records, one click to run | ✅ Working |
| Customer request portal, proposal acceptance page, commitments pages | 🚧 Next |
| PayPal Sandbox: server-side OAuth, **Invoicing v2** milestone invoices (create + send), payment confirmed with the PayPal API | ✅ Working |
| PayPal **webhooks**: signature verified with PayPal, stored once per event id, invoice/capture re-read from PayPal before money is recorded | ✅ Working (live on Vercel) |
| **PayFlow Agent**: finds payments due, prepares PayPal invoices (queued in TrustGate for your approval), checks payment status with PayPal | ✅ Working |
| **ProofFlow Agent**: checks delivery proof against each acceptance criterion; a passing review queues "Approve delivery", which makes the payment due | ✅ Working |
| Approved ScopeWatch change orders become invoiceable milestones | ✅ Working |
| ScopeWatch, ProofFlow, Evidence Vault, VowGraph, reports, settings | 🚧 Planned |

The full plan is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), the agent system is documented in [docs/AGENTS.md](docs/AGENTS.md), and progress is tracked in [docs/DEVLOG.md](docs/DEVLOG.md).

### Hackathon requirements: where each one stands

| Requirement | How PactPop meets it | Status |
|---|---|---|
| Meaningfully integrate a PayPal technology | Invoicing v2 for deposits, milestones and change orders; Orders v2 checkout; verified webhooks drive the commitment timeline | ✅ Invoicing v2, Orders v2 checkout and verified webhooks all working in the Sandbox |
| Meaningfully incorporate AI | AI orchestrator (Groq or Claude) coordinating specialist agents through permission-checked tools that change real records ([docs/AGENTS.md](docs/AGENTS.md)) | ✅ All 8 agents working: Intake, Scope, Pricing, Proposal, Operations, Finance, ProofFlow and PayFlow |
| Working prototype | One-click demo workspace; setup steps below run on any machine with Node.js | ✅ Runs locally |
| Documentation | This README plus [docs/](docs/) | ✅ |
| Public, open-source repo with a license | MIT, see [LICENSE](LICENSE) | ✅ |

---

## The problem

Freelancers rarely lose money on the work itself. They lose it **between the steps**: agreements buried in email, small "can you also…" requests that never get priced, and invoices that are created late and chased by hand. Invoicing tools bill for work that was done. They don't protect the revenue that leaks before an invoice exists.

## Why AI is essential

The inputs are unstructured: client emails, change requests, screenshots and delivery notes. AI agents turn them into structured records (requirements, scope differences, verification reports) that ordinary software can then act on safely. PactPop keeps a strict split:

- **The model interprets** text and proposes *units* of work (pages, features, hours).
- **Code decides.** Prices are calculated by the deterministic pricing engine from your rates. Permissions are enforced by TrustGate on the server. Payment status comes only from PayPal.

## How PayPal is integrated (design)

- A typed server-side gateway calls the PayPal REST APIs: OAuth2 client credentials, **Invoicing v2** (deposits, milestones, approved change orders), **Orders v2** (checkout and capture after approval), and **webhook signature verification**.
- Every mutating call sends a `PayPal-Request-Id` derived from an internal record ID, so retries are idempotent.
- A payment counts as complete **only** after a verified webhook or a server-side status check. A browser redirect is never treated as proof of payment.
- Webhook events are stored with a unique PayPal event ID, so duplicate deliveries are ignored.
- Client secrets and access tokens never reach the browser, and the app refuses to start against non-sandbox PayPal hosts.

## How the agents work (design)

One capable model with eight specialised roles: **Intake, Scope, Pricing, Proposal, Operations, ProofFlow, PayFlow and Finance**. A central orchestrator routes each request. Every tool call passes through **TrustGate**, which returns one of three outcomes:

| Decision | Result |
|---|---|
| `allow` | The tool runs (e.g. reading invoices, drafting a proposal). |
| `approval` | An approval request is created with the AI's reasoning summary. Nothing runs until a human approves it. |
| `deny` | The call is blocked and logged. |

Capturing payments, issuing refunds, changing agreed amounts and applying change orders have a **locked floor of "approval"** that no configuration can relax. Tool policies live in [`src/server/agents/policies.ts`](src/server/agents/policies.ts).

---

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS v4**
- **Drizzle ORM** on **PostgreSQL**, with embedded **PGlite** for zero-setup local development
- **Zod** validation, **bcrypt** password hashing, **Recharts** charts, **three.js** (WebGL background)
- **Vitest** unit tests, **Playwright** browser checks
- **Groq** (OpenAI-compatible API, `openai/gpt-oss-120b`) or **Anthropic Claude** for the agents; **PayPal REST APIs** (Sandbox)

Key decisions and their reasons are recorded in [docs/DECISIONS.md](docs/DECISIONS.md).

## Project structure

```
src/
  app/(marketing)/     landing, features, how-it-works
  app/(auth)/          login, register (+ server actions)
  app/app/             authenticated app: dashboard, clients
  components/          brand, ui primitives, app shell, marketing sections
  lib/                 client-safe helpers (money, plans, cn)
  server/
    db/                schema, migrations, database factory
    auth/              sessions and guards
    services/          domain logic (pricing, clients, finance, accounts, audit, demo)
    agents/            TrustGate tool policies (orchestrator coming next)
    security/          rate limiting
scripts/               migrate, seed
tests/unit/            money and pricing tests
docs/                  architecture, decisions, dev log
```

---

## Getting started

**Requirements:** Node.js 20.9 or newer, and npm.

```bash
git clone https://github.com/Debb1ie/PactPop.git
cd PactPop
npm install
cp .env.example .env        # optional for now: the defaults run locally
npm run db:seed             # creates the local database and the demo workspace
npm run dev                 # http://localhost:3000
```

With no `DATABASE_URL`, data is stored in an embedded PostgreSQL (PGlite) under `./.data/`. Stop the dev server before running `db:seed` or `db:migrate`, because PGlite allows only one process at a time.

### Demo account

On the login page, click **Try the demo workspace** for one-click access. The demo workspace is created automatically on first use. You can also sign in manually:

- **Email:** `demo@pactpop.dev`
- **Password:** `pactpop-demo-2026`

The demo ("Lumen Studio") contains four clients and:
- the $1,500 Northwind Bakery redesign, in progress
- a ScopeWatch change order for 3 extra pages ($300), waiting in the approval queue
- a proposal sent to Becker Legal
- a brand-new request from Kitefly Tours
- a draft commitment

`npm run db:seed` resets it to this state. Seeded records are tagged **DEMO**. **No invoices or payments are seeded**, so "Payments received" stays at $0 until a real PayPal Sandbox payment is made.

### Environment variables

See [`.env.example`](.env.example) for the documented list:

| Variable | Purpose |
|---|---|
| `APP_URL` | Public base URL (PayPal return URLs) |
| `DATABASE_URL` | Empty → PGlite; `postgres://…` → PostgreSQL |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | PayPal **Sandbox** REST app credentials |
| `PAYPAL_BASE_URL` | Must be `https://api-m.sandbox.paypal.com` |
| `PAYPAL_WEBHOOK_ID` | Webhook ID used for signature verification |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | Agent model configuration (`heuristic` = clearly labelled rule-based mode) |

**Never commit `.env` or real credentials.** It's already in `.gitignore`.

### PayPal Sandbox setup

1. Sign in at [developer.paypal.com](https://developer.paypal.com) and open **Apps & Credentials → Sandbox**.
2. Create a REST app, then copy its Client ID and Secret into `.env`.
3. Under **Testing Tools → Sandbox Accounts**, use the generated *personal* account to pay invoices as a test customer.
4. Webhooks need a public URL. Expose your local server with a tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`), then register `<public-url>/api/paypal/webhook` in the app's webhook settings and copy the webhook ID into `PAYPAL_WEBHOOK_ID`.

The PayPal workflow itself is still in development. See the project status above.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Run unit tests (Vitest) |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Migrate and (re)create the demo workspace |

## Testing

```bash
npm test            # money formatting and the pricing engine
npm run typecheck
npm run lint
npm run build
```

The tests check, among other things, that the demo project prices to **$1,500** with a **$750** deposit, that three extra pages price to a **$300** change order, that money never goes through floating-point maths, and that unknown features are flagged instead of priced by guesswork.

## Security notes

- Passwords are hashed with bcrypt, and session tokens are random and stored only as SHA-256 hashes in an httpOnly cookie.
- Every query is scoped to the signed-in user's business, and membership is re-checked on every request.
- Login and registration are rate-limited. Login errors don't reveal whether an account exists.
- Security headers are set: `X-Frame-Options`, `nosniff`, `Referrer-Policy` and `Permissions-Policy`.
- The rate limiter is in-memory, one instance per server. Multi-instance deployments need a shared store.

## Known limitations

- The PayPal integration (PayFlow Agent), ProofFlow and the customer portal are not implemented yet (see Project status).
- In rule-based mode (no `AI_API_KEY`) the planner understands a fixed set of intents. The AI provider (Groq or Claude) handles free-form requests.
- PGlite is for local development only. Use PostgreSQL in production.

## Disclaimer

PayPal is a trademark of PayPal, Inc. PactPop is an independent hackathon project and is not affiliated with or endorsed by PayPal. PactPop helps organise agreements and evidence. It does not provide legal advice or guarantee payment outcomes.

## Tools used

| Tool | How it is used |
|---|---|
| **PayPal Developer Platform (Sandbox)** | Invoicing v2, Orders v2 and Webhooks are the payment backbone: deposits, milestone payments and approved change orders are invoiced through PayPal, and only PayPal-verified events mark money as received. |
| **Groq** (runtime, `openai/gpt-oss-120b`) | Default AI provider for PactPop's agents, used through Groq's OpenAI-compatible chat API with tool calling. Free tier; the orchestrator waits and retries when Groq's rate limit asks it to. |
| **Anthropic Claude** (runtime, optional, `claude-opus-5-5`) | Alternative provider (`AI_PROVIDER=anthropic`). Powers PactPop's agents: extracting requirements from client messages, comparing new requests with the accepted scope, drafting proposals and change orders, and checking deliverable evidence. Accessed through a provider interface, so the model can be swapped. Every tool call goes through TrustGate. |
| **Claude Code** (development) | AI coding assistant used to plan the architecture, write and review code, and run tests and browser checks during the hackathon. It is not part of the running app. |
| **Mascot artwork (Poppy the pup)** | Sticker set and hero illustration supplied by the project owner; cut into transparent stickers for the app (`public/mascot/`). |
| **three.js** | WebGL grid-terrain background that reacts to scrolling, the VowGraph orb view on the dashboard, and the 3D architecture diagram. |

## License

PactPop is free and open source under the [MIT License](LICENSE). There are no paid plans.
