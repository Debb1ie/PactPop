# PactPop: Devpost submission draft

**Tagline:** Make promises. Make progress. Get paid.

**Links**
- Live demo: https://pact-pop.vercel.app (Log in → Try the demo workspace)
- Source (MIT): https://github.com/Debb1ie/PactPop

## Inspiration

Freelancers and small agencies rarely lose money because they can't send an invoice. They lose it in the gaps: an extra page agreed in a chat, a delivery nobody formally accepted, a deposit that was "coming", a final payment chased for weeks. Invoicing tools bill for the work; nothing protects the promise behind it.

## What it does

PactPop connects every client engagement from request to payment, with AI agents doing the busywork and a person approving anything that moves money.

- **Client request page:** a client describes the project in plain words; the Intake Agent turns it into requirements and follow-up questions.
- **Agreements:** Pricing and Proposal agents draft scope, price and milestones from the business's own rate card. The AI estimates units of work; code computes every amount.
- **ScopeWatch:** when a client asks for more, the Scope Agent compares it with the signed agreement and prices a change order. Approving it creates a new immutable agreement version and a new payable milestone.
- **ProofFlow:** delivery proof (notes and links) is checked against each agreed acceptance criterion. A passing check asks the owner to approve the delivery; approving makes the payment due.
- **PayFlow + PayPal:** the PayFlow Agent prepares real PayPal invoices, held for approval. Clients can also pay through a one-link checkout: review the scope, accept by name, pay with PayPal.
- **TrustGate:** every agent tool call is permission-checked on the server: allow, needs approval, or blocked. Money actions have locked floors that no setting or prompt can relax. Everything is logged.

## How we use PayPal

All on the PayPal Sandbox, through PayPal's REST APIs:
- **Invoicing v2:** milestone invoices (deposit, final, approved change orders), created and sent from the milestone's stored amount.
- **Orders v2:** the client checkout uses PayPal Smart Buttons; orders are created and captured on the server, and money is recorded from PayPal's capture response.
- **Webhooks:** `INVOICING.INVOICE.PAID` and `PAYMENT.CAPTURE.COMPLETED` are signature-verified with PayPal, stored once per event id, and trigger a re-read from PayPal before anything is recorded.
- Every write uses a `PayPal-Request-Id`, so retries never duplicate. Credentials never reach the browser, and the app refuses to start against non-Sandbox PayPal.

## How we use AI

An orchestrator coordinates eight specialist agents (Intake, Scope, Pricing, Proposal, Operations, Finance, ProofFlow, PayFlow) through 18 typed tools. It runs on **Groq** (`openai/gpt-oss-120b`), with Claude supported as an alternative provider. The model reasons and chooses tools; the server validates every input, enforces TrustGate, and keeps money in code. Client text and delivery evidence are treated as untrusted data. Without an AI key, a clearly labelled rule-based planner uses the same tools and checks.

## How we built it

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Drizzle ORM on PostgreSQL (Neon in production, embedded PGlite locally), Vercel hosting, PayPal REST APIs (Sandbox), Groq API, Zod, bcrypt, Recharts, three.js, Vitest and Playwright. Development used Claude Code as an AI coding assistant; it is not part of the running app.

## Challenges

Live testing against the PayPal Sandbox found real bugs, which we fixed:
- A model read an amount in cents (150000) as $150,000. Tool results now give the model formatted money only.
- React's development mode rendered PayPal's buttons twice, creating duplicate orders and closing the checkout window.
- The final milestone was payable right after the deposit. Only due payments can now be checked out, enforced on the server.
- Groq's free tier rate-limits multi-step agent runs; the orchestrator waits for `retry-after` and tells the user.

## Accomplishments

- A complete, working loop on real PayPal Sandbox APIs: client request → agreement → scope change → proof check → PayPal invoice or checkout → verified webhook → ledger.
- AI that prepares and people who decide: no price, payment or agreement change happens without code-computed amounts and, where money moves, a human approval.

## What's next

Live PayPal (after review), file uploads for delivery proof, AI-assisted dispute evidence packs from the stored agreement history, and email notifications.
