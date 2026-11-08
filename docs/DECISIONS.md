# Decision log

| # | Date | Decision | Why |
|---|---|---|---|
| 1 | 2026-11-07 | Single Next.js 16 App Router app (TypeScript) | Greenfield repo; one deployable simplifies Render hosting and the hackathon demo. Server logic still separated under `src/server`. |
| 2 | 2026-11-07 | Drizzle ORM over Prisma | Prisma `latest` tag currently points at an 8.0 release candidate; Drizzle is stable, SQL-transparent, and supports both node-postgres and PGlite. |
| 3 | 2026-11-07 | PGlite for zero-setup local dev/tests, PostgreSQL in production | No local Postgres; Docker daemon not running. Same SQL dialect and migrations in both. |
| 4 | 2026-11-07 | Money as integer minor units + ISO currency | Avoids floating-point errors; matches PayPal string amounts via explicit formatting. |
| 5 | 2026-11-07 | Custom session auth (bcrypt + hashed DB session tokens) | Few dependencies, full control over tenant/role checks. |
| 6 | 2026-11-07 | Direct typed PayPal REST gateway; Agent Toolkit/MCP evaluated for dev tooling | Need idempotency keys, amount validation and audit around every PayPal call. |
| 7 | 2026-11-07 | One model, specialised roles, provider abstraction (Anthropic first) | More reliable/cheaper than independent agents; provider swappable. |
| 8 | 2026-11-07 | Brand palette: user-supplied refinement (Aubergine #1B1230, Violet #7656E8, Lavender #B9A5FF, Lilac #F1ECFF) + semantic colours from the brief | The pasted palette refines the brief's purples; success/warning/error/ink kept from brief. |
| 9 | 2026-11-07 | Logo concept: two vow nodes joined by a tide wave meeting at a central agreement point, with a small "pop" burst | Encodes "Vow" (commitment) + "Tide" (coordinated movement) + completion. |
| 10 | 2026-11-07 | License: MIT | Hackathon rules require a public, open-source repo with a visible license file. |
| 11 | 2026-11-07 | `cacheComponents` off; dynamic rendering for all app pages | Per-tenant live financial data must never be served stale. |
| 12 | 2026-11-07 | PactPop is entirely free; subscription plans, trials and pricing page removed (migration `0002`) | Owner decision. Keeps the hackathon submission focused on PayPal + AI rather than SaaS monetisation. |
| 13 | 2026-11-07 | Visual identity: dark glass UI with PactPop's own "aurora" KPI cards, tide-mark motif and accent-bar navigation | Inspired by a reference shot the owner liked, deliberately reworked so it isn't a copy. |
| 14 | 2026-11-07 | WebGL (three.js, lazily loaded) for the background grid terrain | A shader-drawn grid on a displaced mesh gives real perspective and anti-aliasing that 2D canvas lines couldn't. |
| 15 | 2026-11-08 | Visual direction "Trading desk" (owner's choice): dark, hairline panel grid, 4px corners, Archivo expanded headings, JetBrains Mono for all figures and labels, violet for actions, teal for money in | The previous look matched common generated sites; this one is grounded in finance terminals. |
| 16 | 2026-11-08 | One job per page: Dashboard = money only; AI Agents, Commitments, Payments, Approvals separate | Owner request; keeps the finance overview scannable. |
| 17 | 2026-11-08 | Groq (`openai/gpt-oss-120b`) as the default AI provider; Claude stays optional | Free tier fits the owner's no-budget constraint; same tools and TrustGate for both providers. |
| 18 | 2026-11-08 | Hosting on Vercel + Neon instead of Render | Vercel functions don't sleep, so no keep-alive cron is needed; Neon wakes in about a second. Both free. |
| 19 | 2026-11-08 | Tool results shown to the model use formatted money, never minor units | A live test showed a model reading 150000 cents as $150,000. |
| 20 | 2026-11-08 | Client agreement links use a random token; only its SHA-256 is stored; a new link revokes the old | A leaked database can't produce working client links. |
| 21 | 2026-11-08 | Client checkout only for due payments (deposit, or a delivery the owner approved), enforced on the server | A live Sandbox test paid the final milestone right after the deposit. |
| 22 | 2026-11-08 | Approving a delivery is a locked TrustGate floor (`deliverables.approve`) | It is what makes money due, so a person always decides. |
