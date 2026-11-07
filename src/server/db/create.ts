/**
 * Creates a Drizzle database for either:
 * - a real PostgreSQL server (DATABASE_URL=postgres://…)  → node-postgres
 * - embedded PGlite (DATABASE_URL unset, "pglite:./path" or "memory://") → zero-setup local dev/tests
 *
 * Kept free of "server-only" so scripts (migrate/seed) and tests can import it.
 */
import * as schema from "./schema";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";

export type Database = ReturnType<typeof drizzlePg<typeof schema>>;

export const DEFAULT_PGLITE_DIR = "./.data/pglite";

export async function createDatabase(url?: string): Promise<Database> {
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: url,
      max: 10,
      ssl: /sslmode=require/.test(url) ? { rejectUnauthorized: false } : undefined,
    });
    return drizzlePg(pool, { schema });
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = !url ? DEFAULT_PGLITE_DIR : url === "memory://" ? undefined : url.replace(/^pglite:/, "");
  if (dataDir) {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(dataDir, { recursive: true });
  }
  const client = new PGlite(dataDir);
  // Drizzle's query surface is identical for both drivers; the cast unifies the types.
  return drizzlePglite(client, { schema }) as unknown as Database;
}

export async function migrateDatabase(db: Database, url?: string) {
  const migrationsFolder = "./src/server/db/migrations";
  if (url && /^postgres(ql)?:\/\//.test(url)) {
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    await migrate(db, { migrationsFolder });
  } else {
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await migrate(db as any, { migrationsFolder });
  }
}
