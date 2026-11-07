/**
 * Seeds (or resets) the demonstration workspace. See src/server/services/demo.ts for what is created.
 * Deliberately no invoices, payments or PayPal events: payment data only comes from the PayPal Sandbox.
 */
import "dotenv/config";
import { createDatabase, migrateDatabase } from "../src/server/db/create";
import { resetDemoWorkspace } from "../src/server/services/demo";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/demo";

async function main() {
  const url = process.env.DATABASE_URL;
  const db = await createDatabase(url);
  await migrateDatabase(db, url);
  const { business } = await resetDemoWorkspace(db);
  console.log(`✓ demo workspace seeded: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (request portal: /request/${business.slug})`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
