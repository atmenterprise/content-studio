import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { getEnvironment } from "../env";
import * as schema from "./schema";
let pool: Pool | undefined;
export function getPool() {
  pool ??= new Pool({ connectionString: getEnvironment().DATABASE_URL, max: 10 });
  return pool;
}
export function getDatabase() { return drizzle(getPool(), { schema }); }
