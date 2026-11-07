import "dotenv/config";
import { createDatabase, migrateDatabase } from "../src/server/db/create";

async function main() {
  const url = process.env.DATABASE_URL;
  const db = await createDatabase(url);
  await migrateDatabase(db, url);
  console.log(`✓ migrations applied (${url?.startsWith("postgres") ? "postgres" : "pglite"})`);
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
