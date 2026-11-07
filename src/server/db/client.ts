import "server-only";
import { createDatabase, type Database } from "./create";

/**
 * Process-wide database handle. Cached on globalThis so Next.js dev hot-reloads
 * don't open a new PGlite instance (which would lock the data directory).
 */
const g = globalThis as unknown as { __pactpopDb?: Promise<Database> };

export function getDb(): Promise<Database> {
  if (!g.__pactpopDb) g.__pactpopDb = createDatabase(process.env.DATABASE_URL);
  return g.__pactpopDb;
}
