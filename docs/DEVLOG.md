# Development log

## 2026-11-07 — Phase 1–3: inspection, plan, foundation

**Inspection.** The repository was empty. Toolchain: Node 22.23, npm 10.9, git 2.47, Docker 29 (daemon not running). See [ARCHITECTURE.md](ARCHITECTURE.md) §1.

**Implemented**
- Next.js 16.4 App Router + TypeScript + Tailwind v4 scaffold. `cacheComponents` turned off on purpose (DECISIONS #11).
- Drizzle schema for 24 tables, with integer-minor-unit money, unique PayPal external IDs, a unique webhook event id, and tenant `business_id` on every owned row. Migration `0000_init`.
- DB layer that runs on embedded PGlite or real PostgreSQL. Migrate and seed scripts.
- Deterministic pricing engine plus exact money helpers (PayPal value formatting/parsing).
- Session auth (bcrypt, hashed random tokens, httpOnly cookie), membership re-check per request, role gate, rate limiting, audit log and timeline writers.
- TrustGate policy table with locked floors for capture, refund, amount changes and change-order application.
- Design system: brand tokens (light/dark), Sora/Inter/JetBrains Mono, logo mark + favicon, primitives (button, card, field, skeleton, empty/error states, status badge, toasts, confirm dialog, theme toggle).
- Public site: landing, features, how-it-works, pricing. Login and registration.
- App shell (responsive sidebar/drawer, integration status), dashboard (PayPal-confirmed metrics, revenue chart with table view, insights, activity), and clients (list/search, create, detail with balances, payment history and editable notes).
- Demo seed (workspace, 3 clients, and the website-redesign request). No payment data is seeded.

**Tests:** 11 unit tests (money + pricing) pass. `tsc` clean. `next build` OK. HTTP smoke test of all public and authenticated routes OK.
