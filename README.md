# PactPop

**Make promises. Make progress. Get paid.**

PactPop is an AI-powered commercial operations platform for freelancers, consultants and small agencies. It connects the three stages every client engagement goes through:

1. **Agreement:** what was promised?
2. **Evidence:** was the promised work delivered?
3. **Payment:** is the financial commitment ready to be fulfilled, and has PayPal confirmed it?

Specialised AI agents read client requests, structure scope and pricing, catch scope creep, check delivered work against acceptance criteria, and prepare PayPal invoices. A permission layer called **TrustGate** ensures that sensitive financial actions always wait for a human.

> Built for the **PayPal AI Hackathon**. Runs against the **PayPal Sandbox** only, so no real money moves.

---

## Project status

PactPop is under active development. This table is kept honest: anything not marked *Working* is not implemented yet.

| Area | Status |
|---|---|
| Landing, features, how-it-works and pricing pages, revenue-leak calculator, product tour | ✅ Working |
| Registration / login (session auth), plan selection with 14-day trial | ✅ Working |
| Dashboard (PayPal-confirmed metrics only), clients (list, search, create, edit, balances) | ✅ Working |
| Database schema for the whole workflow (24 tables), migrations, demo seed | ✅ Working |
| Deterministic pricing engine, exact money handling, TrustGate policy table | ✅ Working (unit-tested) |
| Light & dark themes, responsive layout with a mobile tab bar, scroll-reactive 3D grid background | ✅ Working |
| One-click demo workspace with sample commitments, scope change and approval | ✅ Working |
| Customer request portal, proposals, commitments & timeline, Approval Center | 🚧 Next |
| Agent orchestrator + Command Center (Anthropic Claude via provider abstraction) | 🚧 Planned |
| PayPal Sandbox: Invoicing v2, Orders v2, webhook verification, reconciliation | 🚧 Planned |
| ScopeWatch, ProofFlow, Evidence Vault, VowGraph, reports, settings | 🚧 Planned |
| Subscription billing (PayPal Subscriptions) and plan-limit enforcement | 🚧 Planned |

The full plan is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and progress is tracked in [docs/DEVLOG.md](docs/DEVLOG.md).

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

One capable model with seven specialised roles: **Intake, Scope, Pricing, Proposal, Payment, Finance and Operations**. A central orchestrator routes each request. Every tool call passes through **TrustGate**, which returns one of three outcomes:

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
- **Zod** validation, **bcrypt** password hashing, **Recharts** charts
- **Vitest** unit tests, **Playwright** browser checks
- Planned: **Anthropic Claude** (agents), **PayPal REST APIs**

Key decisions and their reasons are recorded in [docs/DECISIONS.md](docs/DECISIONS.md).

## Project structure

```
src/
  app/(marketing)/     landing, features, how-it-works, pricing
  app/(auth)/          login, register (+ server actions)
  app/app/             authenticated app: dashboard, clients
  components/          brand, ui primitives, app shell, marketing sections
  lib/                 client-safe helpers (money, plans, cn)
  server/
    db/                schema, migrations, database factory
    auth/              sessions and guards
    services/          domain logic (pricing, clients, finance, accounts, audit)
    agents/            TrustGate tool policies (orchestrator coming next)
    security/          rate limiting
scripts/               migrate, seed
tests/unit/            money, pricing and plan tests
docs/                  architecture, decisions, business model, dev log
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
npm test            # money formatting, pricing engine, plan invariants
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

- The agent workflow, the PayPal integration and the customer portal are not implemented yet (see Project status).
- Subscription plans are shown and recorded at signup, but **nothing is billed** yet.
- PGlite is for local development only. Use PostgreSQL in production.

## Disclaimer

PayPal is a trademark of PayPal, Inc. PactPop is an independent hackathon project and is not affiliated with or endorsed by PayPal. PactPop helps organise agreements and evidence. It does not provide legal advice or guarantee payment outcomes.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author.
