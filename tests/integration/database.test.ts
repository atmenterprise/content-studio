import { afterAll, beforeAll, expect, it } from "vitest";
import { Pool } from "pg";
import { migrate } from "../../lib/db/migrate";
const url = process.env.TEST_DATABASE_URL;
if (!url || !new URL(url).pathname.endsWith("_test")) throw new Error("TEST_DATABASE_URL must name a dedicated database ending in _test.");
const pool = new Pool({ connectionString: url });
beforeAll(async () => { await migrate(pool); });
afterAll(async () => { await pool.end(); });
it("applies the initial schema and migrations are repeatable", async () => {
  await migrate(pool);
  const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  expect(tables.rows.map(row => row.table_name)).toEqual(expect.arrayContaining(["sites", "schemas", "content_entries"]));
  const site = await pool.query("INSERT INTO sites(name,domain,repo_url,api_key,auth0_org_id) VALUES ('Migration test','migration.example','https://example.com/repo','hashed','org_migration') ON CONFLICT (auth0_org_id,domain) DO UPDATE SET name=excluded.name RETURNING *");
  expect(site.rows[0].id).toMatch(/^[a-f0-9-]{36}$/);
  expect(site.rows[0].created_at).toBeInstanceOf(Date);
  const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='content_entries'");
  expect(columns.rows).toContainEqual({ column_name: "data", data_type: "jsonb" });
  expect(columns.rows).toContainEqual({ column_name: "updated_at", data_type: "timestamp with time zone" });
});

async function registry(singleton = true) {
  const { randomUUID } = await import("node:crypto");
  const site = (await pool.query("INSERT INTO sites(name,domain,repo_url,api_key,auth0_org_id) VALUES ('Test',$1,'https://example.com/repo','hash',$2) RETURNING id", [randomUUID() + ".example", "org_test_" + randomUUID()])).rows[0].id as string;
  const schema = (await pool.query("INSERT INTO schemas(site_id,collection_key,label,is_singleton,spec_definition) VALUES ($1,'pages','Pages',$2,'{\"fields\":[]}') RETURNING id", [site, singleton])).rows[0].id as string;
  return { site, schema };
}
function insertEntry(site: string, schema: string, slug: string) {
  return pool.query("INSERT INTO content_entries(site_id,schema_id,slug,data) VALUES ($1,$2,$3,'{}') RETURNING *", [site,schema,slug]);
}
it("rejects a second singleton entry and incompatible mode transitions", async () => {
  const singleton = await registry();
  await insertEntry(singleton.site,singleton.schema,"first");
  await expect(insertEntry(singleton.site,singleton.schema,"second")).rejects.toMatchObject({ code:"23514" });
  const collection = await registry(false);
  await insertEntry(collection.site,collection.schema,"first");
  await insertEntry(collection.site,collection.schema,"second");
  await expect(pool.query("UPDATE schemas SET is_singleton=true WHERE id=$1",[collection.schema])).rejects.toMatchObject({code:"23514"});
});
it.each(["READ COMMITTED", "REPEATABLE READ"])("prevents concurrent singleton inserts at %s", async isolation => {
  const { site, schema } = await registry();
  const first = await pool.connect(), second = await pool.connect();
  try {
    await first.query(`BEGIN ISOLATION LEVEL ${isolation}`);
    await second.query(`BEGIN ISOLATION LEVEL ${isolation}`);
    await first.query("INSERT INTO content_entries(site_id,schema_id,slug,data) VALUES ($1,$2,'one','{}')",[site,schema]);
    const result = second.query("INSERT INTO content_entries(site_id,schema_id,slug,data) VALUES ($1,$2,'two','{}')",[site,schema]).then(() => "unexpected-success", error => error.code as string);
    await new Promise(resolve => setTimeout(resolve,100));
    await first.query("COMMIT");
    expect(["23514","40001"]).toContain(await result);
    await second.query("ROLLBACK");
    expect((await pool.query("SELECT count(*)::int AS n FROM content_entries WHERE schema_id=$1",[schema])).rows[0].n).toBe(1);
  } finally {
    await first.query("ROLLBACK"); await second.query("ROLLBACK"); first.release(); second.release();
  }
});

it("rejects cross-site schema references, duplicate collection keys/slugs and invalid status", async () => {
  const a = await registry(false), b = await registry(false);
  await expect(insertEntry(a.site,b.schema,"foreign")).rejects.toMatchObject({code:"23503"});
  await expect(pool.query("INSERT INTO schemas(site_id,collection_key,label,spec_definition) VALUES ($1,'pages','Duplicate','{\"fields\":[]}'::jsonb)",[a.site])).rejects.toMatchObject({code:"23505"});
  await insertEntry(a.site,a.schema,"same");
  await expect(insertEntry(a.site,a.schema,"same")).rejects.toMatchObject({code:"23505"});
  await expect(pool.query("INSERT INTO content_entries(site_id,schema_id,slug,data,status) VALUES ($1,$2,'invalid','{}','archived')",[a.site,a.schema])).rejects.toMatchObject({code:"23514"});
});
it("protects parent records and updates timestamps only on entry changes", async () => {
  const {site,schema} = await registry(false);
  const entry = (await insertEntry(site,schema,"existing")).rows[0];
  await expect(pool.query("DELETE FROM sites WHERE id=$1",[site])).rejects.toMatchObject({code:"23503"});
  await expect(pool.query("DELETE FROM schemas WHERE id=$1",[schema])).rejects.toMatchObject({code:"23503"});
  await pool.query("SELECT pg_sleep(0.02)");
  await pool.query("INSERT INTO content_entries(site_id,schema_id,slug,data) VALUES ($1,$2,'existing','{}') ON CONFLICT(schema_id,slug) DO NOTHING",[site,schema]);
  const same = (await pool.query("SELECT updated_at FROM content_entries WHERE id=$1",[entry.id])).rows[0];
  expect(same.updated_at.getTime()).toBe(entry.updated_at.getTime());
  const updated = (await pool.query("UPDATE content_entries SET data='{\"title\":\"Changed\"}' WHERE id=$1 RETURNING updated_at",[entry.id])).rows[0];
  expect(updated.updated_at.getTime()).toBeGreaterThan(entry.updated_at.getTime());
});
