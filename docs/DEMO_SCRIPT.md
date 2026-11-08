# Demo video script (about 3 minutes)

Recorded on the live site: https://pact-pop.vercel.app

## Before you record

1. Log in with **Try the demo workspace**, open **Settings → Workspace → Reset demo data**, then log in again. Everything starts fresh.
2. Have the **Sandbox Personal** test account login ready (developer.paypal.com → Testing Tools → Sandbox Accounts).
3. Groq's free tier can pause an agent for 20–60 seconds ("Retrying in 18s…"). Record each agent question as its own take and cut the waiting.

## Shot list

| Time | Screen | What to do | What to say |
|---|---|---|---|
| 0:00 | Landing page | Scroll slowly past the hero and the feature panels | "Freelancers lose money in the gap between what was promised and what gets paid. PactPop closes that gap with AI agents and PayPal." |
| 0:15 | Dashboard | Log in → Try the demo workspace | "This is a studio's workspace: agreements, cash flow and approvals, with only PayPal-confirmed money counted as received." |
| 0:25 | AI Agents | Ask: *Northwind Bakery just asked for an online ordering page and a blog. Is that covered by their agreement?* | "ScopeWatch reads the signed agreement. Online ordering is excluded, the blog is a new page, so it prices a change order from my rate card. The AI never sets a price; my rates do." |
| 0:55 | Approvals | Approve **3 additional pages ($300)** | "TrustGate holds every money decision for me. Approving creates version 2 of the agreement and a new payment." |
| 1:10 | AI Agents | Ask: *Check the delivery proof Northwind Bakery submitted.* | "ProofFlow compares the delivery evidence with each acceptance criterion. Everything checks out, so it asks me to approve the delivery." |
| 1:30 | Approvals | Approve **Approve delivery: Northwind Bakery · Final delivery** | "Approving the delivery is what makes the final payment due." |
| 1:40 | AI Agents | Ask: *Invoice Northwind Bakery for their final delivery.* Then approve it in Approvals | "PayFlow prepares a real PayPal invoice. It waits for my approval, then goes out through PayPal's Invoicing API." |
| 2:00 | Payments | Show the new invoice under PayPal invoices, with its Payer page link | "That's a live PayPal Sandbox invoice." |
| 2:10 | Commitments → Becker Legal → **Client link → Open** | Accept as *Tom Becker*, tick the box, **Accept agreement**, then **PayPal** → log in as the Sandbox buyer → **Pay** | "My client gets one link: review the scope, accept by name, pay the deposit with PayPal. PactPop captures the payment on the server." |
| 2:40 | Client page | Show "Deposit received, confirmed by PayPal" and "Next payment… not due yet" | "Only money that's due can be paid. The final payment opens when the work is delivered." |
| 2:50 | Payments | Show Received, the transaction and the timeline | "Payments count only after PayPal confirms them, through a verified webhook or a server-side check." |
| 3:00 | Settings → Permissions, then GitHub | Show the locked TrustGate rules, then the repo | "AI prepares, people decide. PactPop is free and open source under MIT." |
