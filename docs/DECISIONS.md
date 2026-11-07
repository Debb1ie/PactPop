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
| 10 | 2026-11-07 | License: MIT (pending owner confirmation) | Common for hackathon submissions; easy to change before publishing. |
