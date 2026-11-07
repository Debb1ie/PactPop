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

## 2026-11-07 — Website conversion & monetization pass

**Implemented**
- `src/lib/plans.ts` is now the single source of truth for plans: Starter (free, 3 commitments), Pro ($29, or $24/mo yearly), Studio ($79, or $66/mo yearly, 3 seats + $15/seat), and AI action packs ($10 per 1,000).
- Landing page: trust bullets under the hero; an interactive revenue-leak calculator; a 5-step product tour of the demo scenario; a who-it's-for section; a comparison table (email/spreadsheets vs invoicing apps vs PactPop); billing FAQs; a stronger closing call to action; a sticky mobile Get Started bar.
- Pricing page: monthly/annual toggle (annual is the default), featured Pro plan, AI add-on, and a full plan comparison table.
- Signup carries `?plan=`. Paid plans start a 14-day trial (`businesses.plan`, `trial_ends_at`, migration `0001`). The app sidebar shows the plan, trial days left, or an Upgrade link.
- `docs/BUSINESS_MODEL.md`: revenue streams, conversion design, unit-economics assumptions, metrics.

**Tests:** 15 unit tests pass (new plan invariants). Lint and typecheck clean. Production build passes. A Chrome end-to-end check covered pricing → Pro trial signup → dashboard with trial badge. Browser console clean on `/`, `/pricing` and `/register`.

## 2026-11-07 — Bug-fix pass + dark glass redesign

**Bugs fixed (found by a Playwright audit in Chrome plus screenshot review)**
- The logo icon disappeared on mobile and the auth pages because every copy shared one SVG gradient ID and the first copy was inside a hidden sidebar. IDs are now unique per instance (`useId`).
- The clients table hid its Paid and Outstanding columns on phones. It's now a responsive list.
- The empty revenue chart showed "$0" on every axis tick. It now shows an empty state.
- Logged-in users could still open `/login` and `/register`. They're now redirected to the dashboard.
- The mobile dashboard overflowed sideways by 34px (grid tracks without `minmax(0, …)`).
- Every insight showed a warning icon. Icons now match the tone.
- The dev-only Next.js badge overlapped the sidebar avatar and user menu, so it's disabled.
- The Add client page referred to a request portal that doesn't exist yet. The text is fixed.

**Redesign** (matching the reference the owner supplied): near-black canvas with a blue-violet ambient glow, translucent glass panels, pastel gradient KPI cards with a wave motif, pill sidebar with a white active item, a top bar with working client search, a quick-add button and a user menu, Quick Actions tiles, a purple "Upgrade to Pro" card, a mobile tab bar and account sheet, and segmented controls. Dark is the default; light mode keeps the same structure. The landing hero now shows a dashboard preview with floating cards.

**Checks:** 15 unit tests pass. Lint and typecheck clean. Production build passes. The Playwright audit (desktop and mobile, light and dark, logged out and logged in) finds no console errors, no horizontal overflow and no broken links.
