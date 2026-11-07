/**
 * Seeds a demonstration workspace. Every seeded row has is_demo = true and is labelled DEMO in the UI.
 *
 * Deliberately NOT seeded: invoices, payments or PayPal events. Payment data in PactPop only ever
 * comes from the real PayPal Sandbox, so the demo flow creates it live.
 *
 * Idempotent: re-running removes and recreates the demo workspace only.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { createDatabase, migrateDatabase } from "../src/server/db/create";
import { businesses, clients, projectRequests, users } from "../src/server/db/schema";
import { createAccount } from "../src/server/services/accounts";

export const DEMO_EMAIL = "demo@pactpop.dev";
export const DEMO_PASSWORD = "pactpop-demo-2026";

async function main() {
  const url = process.env.DATABASE_URL;
  const db = await createDatabase(url);
  await migrateDatabase(db, url);

  const [existing] = await db.select().from(users).where(eq(users.email, DEMO_EMAIL));
  if (existing) {
    await db.delete(businesses).where(eq(businesses.slug, "lumen-studio"));
    await db.delete(users).where(eq(users.id, existing.id));
  }

  const { business } = await createAccount(db, {
    name: "Maya Santos",
    email: DEMO_EMAIL,
    passwordHash: await bcrypt.hash(DEMO_PASSWORD, 12),
    businessName: "Lumen Studio",
    isDemo: true,
  });

  const [northwind] = await db
    .insert(clients)
    .values([
      {
        businessId: business.id,
        name: "Daniel Reyes",
        email: "daniel@northwind-bakery.example",
        company: "Northwind Bakery",
        phone: "+1 555 0142",
        website: "https://northwind-bakery.example",
        notes: "Prefers email. Wants the site live before the spring menu launch.",
        isDemo: true,
      },
      { businessId: business.id, name: "Priya Natarajan", email: "priya@kitefly.example", company: "Kitefly Tours", isDemo: true },
      { businessId: business.id, name: "Tom Becker", email: "tom@beckerlaw.example", company: "Becker Legal", isDemo: true },
    ])
    .returning();

  // The demo scenario starts from this incoming request (step 1 of the demo script).
  await db.insert(projectRequests).values({
    businessId: business.id,
    clientId: northwind.id,
    contactName: "Daniel Reyes",
    contactEmail: "daniel@northwind-bakery.example",
    company: "Northwind Bakery",
    rawText:
      "Hi! We need our bakery website redesigned before our spring menu launch. We're thinking 5 pages: Home, Menu, About, Catering and Contact. " +
      "It has to look great on phones since most customers find us on mobile, and we'd like basic SEO so we show up for 'bakery near me'. " +
      "Our budget is around $1,500 and we'd love it done in two weeks.",
    statedBudgetMinor: 150000,
    statedDeadline: "2 weeks",
    source: "portal",
    isDemo: true,
  });

  console.log(`✓ demo workspace seeded: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (request portal: /request/${business.slug})`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
