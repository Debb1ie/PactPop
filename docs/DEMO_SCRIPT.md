# PactPop: demo video script (3:00)

Final script for the PayPal AI Hackathon demo video. It shows PactPop working in a web browser on the live site and highlights every place PayPal is used.

- **Live app:** https://pact-pop.vercel.app
- **Code:** https://github.com/Debb1ie/PactPop
- **Length:** 3:00 maximum (spoken lines fit in about 2:50)

---

## Before you record

1. Open Chrome, set zoom to 100% and press F11 for full screen.
2. Tab 1: https://pact-pop.vercel.app
3. Tab 2: https://github.com/Debb1ie/PactPop
4. Keep the PayPal Sandbox **Personal** buyer email and password ready to paste (developer.paypal.com, then Testing Tools, then Sandbox Accounts).
5. Optional clean start: log in with the demo workspace, open https://pact-pop.vercel.app/app/settings?tab=workspace and click **Reset demo data**.
6. Turn on Do Not Disturb.
7. Start the recorder: **Win + Shift + R** (Snipping Tool), select the whole screen so the PayPal pop-up is captured, then click **Start**.

---

## Where PayPal appears in this video

| # | Page | PayPal tool | Scene |
|---|---|---|---|
| 1 | Payments: "PayPal Sandbox connected" | PayPal REST API, OAuth 2.0 (Sandbox) | 6 |
| 2 | AI Agents: PayFlow Agent prepares an invoice | Invoicing API v2 | 5 |
| 3 | Approvals: invoice sent after approval | Invoicing API v2 | 5 |
| 4 | Payments: PayPal invoice and Payer page | PayPal-hosted invoice | 6 |
| 5 | Client link: yellow PayPal button | Orders API v2 + Smart Payment Buttons | 7 |
| 6 | Payment confirmed | Webhooks + signature verification | 8 |
| 7 | Payments: Check button | Server-side status check with PayPal | 8 |
| 8 | Receipt: reference, fee, net, paper trail | PayPal capture record | 9 |
| 9 | Dashboard and Payments: Received | Only PayPal-confirmed money counts | 2, 8 |

---

## Scene 1: Hook (0:00 to 0:12)

**Page:** https://pact-pop.vercel.app

**Do:**
- Hover the three cards (Tide, Vow, Pop) so they tilt.
- Scroll slowly to the features and hover the blue **PayPal** panel.

**Say:**
> "Freelancers lose money in the gaps between what was promised and what gets paid. PactPop closes that gap with AI agents and PayPal."

**Caption:** PactPop: AI agents + PayPal for freelancers

---

## Scene 2: Log in and dashboard (0:12 to 0:22)

**Page:** https://pact-pop.vercel.app/login, then https://pact-pop.vercel.app/app/dashboard

**Do:**
- Click **Try the demo workspace**.
- On the Dashboard, point at the **received** figure and the commitment cards.

**Say:**
> "This is a studio's workspace: its agreements, cash flow and payments. Money only counts as received after PayPal confirms it."

**Caption:** Only PayPal-confirmed money counts

---

## Scene 3: AI catches scope creep (0:22 to 0:45)

**Page:** https://pact-pop.vercel.app/app/command (AI Agents)

**Do:**
- Type exactly:
  `Northwind Bakery just asked for an online ordering page and a blog. Is that covered by their agreement?`
- Press Enter. While it works, point at the tool steps. If it takes long, keep recording and cut the wait later.

**Say:**
> "My client asks for more work. The Scope Agent reads the signed agreement, sees online ordering was excluded and the blog is a new page, and prices a change order from my own rate card. The AI never sets a price."

**Caption:** AI ScopeWatch: prices come from the rate card, never the AI

---

## Scene 4: TrustGate approval (0:45 to 0:55)

**Page:** https://pact-pop.vercel.app/app/approvals

**Do:**
- Point at the header (Waiting, Money on hold).
- On **"Approve change order: 3 additional pages" ($300)**, click **Approve**.

**Say:**
> "Anything that moves money waits for me. Approved: the agreement is now version 2, with a new 300 dollar payment."

**Caption:** TrustGate: AI prepares, you approve

---

## Scene 5: PayFlow sends a PayPal invoice (0:55 to 1:20)

**Page:** https://pact-pop.vercel.app/app/command, then https://pact-pop.vercel.app/app/approvals

**Do:**
- In AI Agents, type exactly:
  `Invoice Northwind Bakery for their final delivery.`
- When it says the invoice is waiting for approval, open **Approvals**.
- On **"Send PayPal invoice: Northwind Bakery"**, click **Approve**.

**Say:**
> "The PayFlow Agent prepares a real PayPal invoice. When I approve it, PactPop sends it through PayPal's Invoicing API, and the amount comes from the agreement, not from the AI."

**Caption:** PayPal Invoicing API v2

> If the agent says the final payment is not due yet, use the Payments page instead: on the **Deposit (50%)** row click **Send PayPal invoice**.

---

## Scene 6: The invoice is live on PayPal (1:20 to 1:35)

**Page:** https://pact-pop.vercel.app/app/payments

**Do:**
- Point at the **PayPal Sandbox connected** badge (top right).
- Scroll to **PayPal invoices** and point at the new invoice.
- Click **Payer page** to show PayPal's own invoice page, then switch back to the PactPop tab.

**Say:**
> "Here's the invoice, live in the PayPal Sandbox, and this is PayPal's own page where my client can pay it."

**Caption:** Live PayPal Sandbox invoice

---

## Scene 7: The client pays with PayPal (1:35 to 2:10)

**Page:** https://pact-pop.vercel.app/app/commitments, then the client link it creates (`https://pact-pop.vercel.app/agreement/...`)

**Do:**
- In the **Becker Legal** row, click **Client link**, then **Open**.
- Scroll slowly through **What's included** and **Payments**.
- In **Your full name** type `Tom Becker`, tick the box, click **Accept agreement**.
- Click the yellow **PayPal** button.
- In the PayPal window, log in with the Sandbox buyer and click **Complete Purchase**.

**Say:**
> "Or my client gets one link. They review the scope, accept by name and pay the deposit with PayPal's checkout. The order is created and captured on our server."

**Caption:** PayPal Orders API v2 + Smart Payment Buttons

---

## Scene 8: Payment confirmed by PayPal (2:10 to 2:25)

**Page:** the client page, then https://pact-pop.vercel.app/app/payments

**Do:**
- On the client page, show **"Deposit (50%) received, confirmed by PayPal"** and Poppy.
- Switch to the PactPop tab and open **Payments**.
- Point at **Received** and the new row in **Transactions**.
- Hover the **Check** button on an unpaid invoice.

**Say:**
> "PayPal confirms the payment with a signed webhook. PactPop verifies the signature and double-checks with PayPal before it counts a single dollar."

**Caption:** Verified PayPal webhooks and server-side checks

---

## Scene 9: Every payment is documented (2:25 to 2:45)

**Page:** https://pact-pop.vercel.app/app/payments, then the receipt page (`/app/payments/receipts/...`)

**Do:**
- In **Transactions**, click **Receipt**.
- Point at the PayPal reference, PayPal fee and net received.
- Scroll to the **Paper trail**.
- Click **Download PDF** (close the print dialog afterwards).

**Say:**
> "Every PayPal payment gets a receipt with PayPal's reference, fee and net, plus a full paper trail. I can save it as a PDF or an image."

**Caption:** Receipts with PayPal's own record

---

## Scene 10: Close (2:45 to 3:00)

**Page:** https://pact-pop.vercel.app/app/settings?tab=permissions, then https://github.com/Debb1ie/PactPop

**Do:**
- Scroll slowly past the locked money rules.
- Switch to the GitHub tab and show the README.

**Say:**
> "Refunds and payment captures can never run automatically. PactPop: built on PayPal, powered by AI, free and open source. Make promises. Make progress. Get paid."

**Caption:** PayPal Sandbox · Groq AI · MIT open source

---

## Editing (Clipchamp)

1. Import the recording, then split (**S**) and delete the AI waiting time and mistakes.
2. Add the captions above at each scene.
3. Optional intro (2 seconds): Poppy from `public/mascot/hero.webp` with the PactPop name.
4. End on the tagline: **Make promises. Make progress. Get paid.**
5. Export at 1080p and keep the total under 3:00.

## If you are over 3:00, cut in this order

1. Scene 6: skip the Payer page click.
2. Scene 4: say "approved" without pausing on the header.
3. Scene 1: shorten the landing scroll.

Keep Scenes 7, 8 and 9 (checkout, webhook confirmation, receipt). They are the strongest proof of the PayPal integration.

## Upload

1. YouTube, then Create, then Upload video.
2. Title: `PactPop: AI agents + PayPal for freelancers (PayPal AI Hackathon)`
3. Visibility: Unlisted or Public. Not made for kids.
4. Paste the link into Devpost and check it plays in a private window.
