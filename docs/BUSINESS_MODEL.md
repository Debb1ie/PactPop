# PactPop business model

> Working document. All numbers below are **planning assumptions**, not measured results. Re-check them against real usage and current provider prices before launch.

## Positioning

Invoicing tools bill for work that was done. PactPop **protects revenue that would otherwise leak**: unbilled scope creep, slow or forgotten invoices, and time spent chasing payments. That makes it easy to sell on value. The landing page's revenue-leak calculator puts a number on this for each visitor, using their own inputs.

## Revenue streams

| Stream | Price | Why it's profitable |
|---|---|---|
| **Pro** subscription | $29/mo, or $24/mo billed yearly ($288) | Main revenue. Priced below one hour of the customer's billable time. |
| **Studio** subscription | $79/mo, or $66/mo billed yearly; 3 seats included | Agencies get more value and have less price sensitivity. |
| **Extra seats** (Studio) | $15/seat/mo | Grows with the customer's team, with almost no extra cost to us. |
| **AI action packs** | $10 per 1,000 agent actions | Expansion revenue from heavy users, priced well above model cost. |

PactPop **does not take a cut of client payments**. Clients pay the business directly through PayPal at PayPal's standard fees. This keeps trust high and avoids money-transmission complexity. A platform-fee model through PayPal's partner programme can be evaluated later.

Plan definitions live in one place: `src/lib/plans.ts`. They drive the marketing pages, the signup flow, and (next) in-app limits and billing.

## Conversion design

- **Free Starter plan**, no card required, with 3 active commitments. A freelancer can run real projects, and the limit is reached once the business grows.
- **14-day Pro/Studio trial** at signup (`?plan=pro`). The chosen plan and trial end date are stored on the business.
- **Annual-first toggle** ("2 months free"). Yearly prepayment improves cash flow and retention.
- **Upgrade moments** (to build in app): hitting the commitment limit, the first ScopeWatch detection on Starter ("upgrade to turn this into a $300 change order"), and running out of AI actions.
- **Value anchoring:** the pricing headline ("less than one unbilled hour a month") and the calculator's "Pro pays for itself if…" line.

## Unit economics (assumptions to validate)

| Item | Assumption |
|---|---|
| AI cost per agent action | A few cents at most with a mid-size model and short structured prompts. Measure in `agent_executions.input_tokens/output_tokens`. |
| Pro AI allowance | 1,000 actions/mo. Typical use is expected to be far below this. |
| Hosting + database per active account | Low, on shared Render + managed Postgres. |
| Target gross margin | **80%+**, typical for SaaS. Keep the cost per AI action under ~10% of plan price at typical usage. |

To protect margin, use the cheaper model for classification and routing and the stronger model only for drafting. Cache the system prompts. Keep pricing maths in code, not in the model.

## Metrics to track

Visitor → signup rate, signup → first commitment, Starter → paid conversion, trial → paid conversion, monthly vs. annual mix, net revenue retention (seats + packs), AI cost per account, and churn.

## Not built yet

- Subscription billing. The natural choice is the **PayPal Subscriptions API**, which keeps the whole product on PayPal.
- In-app enforcement of plan limits and the upgrade prompts.
- Usage metering for AI action packs (the data already exists in `agent_executions`).
