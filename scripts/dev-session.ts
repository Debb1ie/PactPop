/** Dev/test helper: mints a session cookie for the demo user (never used in production code). */
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { createDatabase } from "../src/server/db/create";
import { businessMembers, sessions, users } from "../src/server/db/schema";

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("not in production");
  const db = await createDatabase(process.env.DATABASE_URL);
  const [u] = await db.select().from(users).where(eq(users.email, "demo@pactpop.dev"));
  const [m] = await db.select().from(businessMembers).where(eq(businessMembers.userId, u.id));
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({ userId: u.id, tokenHash: createHash("sha256").update(token).digest("hex"), activeBusinessId: m.businessId, expiresAt: new Date(Date.now() + 3600e3) });
  console.log(token);
  process.exit(0);
}
main();
