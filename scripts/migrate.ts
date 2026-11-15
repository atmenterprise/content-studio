import { Pool } from "pg";
import { migrate } from "../lib/db/migrate";
try { process.loadEnvFile(".env.local"); } catch { /* exported environment is also supported */ }
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. See .env.example.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try { await migrate(pool); console.info("Content Studio migrations applied."); }
finally { await pool.end(); }
