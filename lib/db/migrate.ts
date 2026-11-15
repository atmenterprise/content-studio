import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Pool } from "pg";
export async function migrate(pool: Pool, directory = fileURLToPath(new URL("../../db/migrations/", import.meta.url))) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(72819345)");
    await client.query("CREATE TABLE IF NOT EXISTS studio_migrations (name text PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    for (const name of (await readdir(directory)).filter(name => name.endsWith(".sql")).sort()) {
      const source = await readFile(`${directory}/${name}`, "utf8");
      const hash = createHash("sha256").update(source).digest("hex");
      const existing = await client.query<{ hash: string }>("SELECT hash FROM studio_migrations WHERE name = $1", [name]);
      if (existing.rows[0]) {
        if (existing.rows[0].hash !== hash) throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await client.query(source);
      await client.query("INSERT INTO studio_migrations(name,hash) VALUES ($1,$2)", [name, hash]);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}
