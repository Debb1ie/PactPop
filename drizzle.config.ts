import { defineConfig } from "drizzle-kit";

// `drizzle-kit generate` only needs the schema; migrations are applied by scripts/migrate.ts
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./src/server/db/migrations",
});
