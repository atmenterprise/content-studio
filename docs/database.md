# Database setup and migrations

Use PostgreSQL 17 or a dedicated Neon PostgreSQL development branch. The application uses pg connection pooling with Drizzle models; use the Neon-provided TLS connection string for hosted databases. Do not disable TLS certificate verification. A direct connection is preferable for migrations; application pooling can use the Neon pooled endpoint.

Copy .env.example to .env.local and set DATABASE_URL. `npm run db:migrate` reads .env.local when present and also supports exported variables. It takes a transaction-scoped advisory lock, applies db/migrations/*.sql in filename order, and records each checksum in studio_migrations. A repeat run is a no-op; editing an applied migration is rejected. All pending migrations apply in one transaction. Add a new migration for every change.

`lib/db/schema.ts` defines the Drizzle models. `npm run db:generate` can produce reviewable schema SQL under db/generated; review and integrate needed SQL into a new versioned db/migrations file before running the migration command. Drizzle schema generation does not capture the singleton triggers, which remain explicit reviewed SQL. Do not use schema push against a production database.

## Disposable local verification

Start Docker Desktop, then create an isolated test server:

```sh
docker run --name content-studio-postgres --detach --publish 127.0.0.1:55432:5432 \
  --env POSTGRES_PASSWORD=studio-local --env POSTGRES_DB=content_studio_test postgres:17-alpine
```

If this container already exists, use `docker start content-studio-postgres`. For the separate application development database, run `docker exec content-studio-postgres createdb -U postgres content_studio`, then copy the matching local DATABASE_URL from .env.example into .env.local and run `npm run db:migrate`. The example password is for this local disposable container only. Tests never connect to a database unless TEST_DATABASE_URL explicitly names a database ending in _test.

```sh
TEST_DATABASE_URL=postgresql://postgres:studio-local@localhost:55432/content_studio_test npm run test:integration
```

The tests apply migrations and create uniquely identified fixture records. They verify tenant foreign keys, uniqueness, valid statuses, restrictive parent deletion, timestamps, singleton mode changes, and simultaneous writes from independent connections at two isolation levels. They do not access the reference trainer site's database. Tests retain records for debugging; use a new disposable database for a completely fresh run.

For a fresh migration rehearsal on the same server:

```sh
docker exec content-studio-postgres createdb -U postgres content_studio_migration_test
DATABASE_URL=postgresql://postgres:studio-local@localhost:55432/content_studio_migration_test npm run db:migrate
DATABASE_URL=postgresql://postgres:studio-local@localhost:55432/content_studio_migration_test npm run db:migrate
```

The first run applies both migrations; the second verifies their recorded checksums without changing content. Stop the disposable server with `docker stop content-studio-postgres` when finished.

## Integrity and rollback

Each schema belongs to a site. Entry ownership must match its schema through a compound foreign key. Singleton entry writes serialize through the parent schema row; a concurrent writer at REPEATABLE READ may receive PostgreSQL serialization failure 40001 and must retry the entire transaction. A mode change from collection to singleton rejects existing multi-entry content. Entry updates set updated_at in the database; insert conflicts that perform no entry update retain its timestamp.

Application rollback must preserve all tables and tenant data. A migration error rolls back its transaction automatically. For deployed changes, prefer a corrective forward migration; restore a tested Neon branch/backup when recovery requires it. Do not drop tenant tables or run destructive reverse migrations in production. Recreating an empty database is only appropriate for disposable development/testing databases.
