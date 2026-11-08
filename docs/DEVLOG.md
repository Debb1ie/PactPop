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

## 2026-11-07 — Scroll-reactive 3D grid + working demo account

- `src/components/fx/scroll-grid.tsx`: a canvas perspective floor behind the marketing and auth pages. Scroll velocity drives travel along z (forward when scrolling down, back when scrolling up), page progress raises the horizon (the camera tilts), the vanishing point follows the pointer, and there is a slow idle drift. It's DPR-aware, re-reads theme colours when the theme changes, pauses on hidden tabs, and stays static under `prefers-reduced-motion`.
- Demo workspace moved into `src/server/services/demo.ts`, shared by `db:seed` and a new **Try the demo workspace** button (`demoLoginAction`). The button creates the demo on first use and can only sign into the `is_demo` workspace.
- The demo now contains realistic records: an in-progress $1,500 commitment with versions, milestones and deliverables; a ScopeWatch scope change with a $300 change order and a pending TrustGate approval; a sent proposal; a new request; a draft; and a timeline. It still has no invoices or payments.
- Verified in Chrome: canvas frames change on scroll, the demo button lands on a populated dashboard, and there are no console errors.

## 2026-11-07 — Free & open source, own visual identity, WebGL grid

- **Removed all monetisation:** plans, trials, the pricing page, the upgrade card and tile, plan badges, the `businesses.plan` and `trial_ends_at` columns (migration `0002`), plan tests and the business-model doc. Added the MIT `LICENSE`, as the hackathon rules require.
- **Design reworked** so it is inspired by, not copied from, the owner's reference shot:
  - "Aurora" KPI cards: dark surface, corner glow, gradient hairline edge and the logo's tide mark.
  - Accent-bar sidebar navigation.
  - A request-link card replaces the upgrade card.
  - Quick actions as a list.
  - Pill search and a primary "New client" button.
- **Background grid rebuilt in WebGL (three.js):** a shader-drawn major/minor grid on a displaced terrain mesh, with fog and crest highlights. Scroll velocity drives forward flight and wave amplitude, scroll progress lowers and pitches the camera, and the pointer adds parallax. The 2D canvas line version was removed.
- README: hackathon-requirements map and a "Tools used" section.

## 2026-11-07: Non-generic design pass, 3D VowGraph, mission alignment

- Applied the design review principles: no glows or neon, matte surfaces, cool neutrals tinted toward the accent, no accent rails, no decorative numbering (numbers remain only where order matters: workflow steps), a left-aligned hero, and card styling used by role.
- Dashboard KPI tiles became an account-style **Statement** strip, with attention flags such as "Action needed" and overdue counts.
- Quick actions became plain rows. The owner-approved request-link card was kept exactly as it was.
- **VowGraph 3D** (`src/components/fx/orb-field.tsx`, `src/server/services/vowgraph.ts`): one glass orb per commitment, sized by agreed amount. Inner rings are milestones and light up when paid; satellites are pending change orders. Hover shows details, click opens the client. Built from real foreign keys.
- **3D architecture** on the landing and how-it-works pages: client portal → AI agents → TrustGate → PayPal → ledger, joined by flowing links. Ring counts encode real structure (8 agent roles, 3 TrustGate decisions, 3 PayPal APIs).
- Marketing copy reworked as documents: ScopeWatch as a redline, ProofFlow as a checklist, TrustGate as a permissions table, and a signature-line call to action.
- Agent roster aligned with the mission brief: the **PayFlow** Agent and a separate **ProofFlow** Agent (8 roles).
- Fixed: a Three.js transmission pass ignores transparent meshes, so milestone rings must be opaque.

## 2026-11-07: Agentic dashboard

- **Orchestrator** (`src/server/agents/orchestrator.ts`): runs Claude Opus 5.5 tool use (adaptive thinking, effort medium, cached system prompt, server-side refusal fallback), or a labelled rule-based planner when no key is set. Every tool call is zod-validated, TrustGate-checked against the business's policies with locked floors, recorded in `agent_tool_calls`, and streamed to the browser as NDJSON.
- **12 tools** (`src/server/agents/tools.ts`) backed by real services (`src/server/services/workflow.ts`): intake analysis, engine-priced quotes and proposals, ScopeWatch change orders, approvals. Tools take units, never prices.
- **Approvals execute real changes.** Approving a change order writes agreement v2, raises the agreed total, adds a change-order milestone, and records timeline and audit entries. Reject marks the change order rejected. Both are idempotent.
- **UI**:
  - Dashboard: "Ask PactPop" console with live agent steps, TrustGate decision chips and inline approval cards.
  - Agent briefing with one-click Run.
  - "Needs your decision" panel.
  - Command Center page with run history and the tool list.
  - Approval Center with decision history.
- ScopeWatch reads lists ("a Team page, a Gallery and an FAQ") and doesn't duplicate a pending change order.
- Default `AI_MODEL` is now `claude-opus-5-5`.
- Tests: 25 passing, including an end-to-end agent workflow on in-memory Postgres. Verified live in Chrome: $1,500 agreement → ScopeWatch $300 change order → approve → $1,800, with the dashboard updating.

## 2026-11-08: Trading-desk redesign and page split

- New visual system (owner chose "Trading desk"): hairline panel grid, 4px corners, Archivo with expanded headings, JetBrains Mono for every figure and label, violet only for actions, teal for money in, live indicator.
- **Dashboard is money only**:
  - Account position: contracted revenue, segmented received / invoiced / scheduled bar, change orders and pipeline.
  - Cash flow chart, scheduled vs received, with a validated violet/teal palette and a table view.
  - Receivables schedule with late flags.
  - Ledger.
  - One-line approval alert.
- **Separate pages**:
  - AI Agents: console, briefing and run history.
  - Commitments: agreements table with milestone bars, VowGraph and activity.
  - Payments: receivables, PayPal invoices, transactions and received chart.
  - Approvals.
- Mobile: five-tab bar, with the remaining pages listed in the account sheet.
