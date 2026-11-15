import { defineConfig } from "drizzle-kit";
try { process.loadEnvFile(".env.local"); } catch { /* optional for schema generation */ }
export default defineConfig({ dialect: "postgresql", schema: "./lib/db/schema.ts", out: "./db/generated", dbCredentials: { url: process.env.DATABASE_URL ?? "" } });
