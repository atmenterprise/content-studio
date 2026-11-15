# ATM Content Studio

A standalone content workspace built with Next.js App Router, TypeScript, Tailwind, Auth0 organizations, and PostgreSQL/Drizzle.

## Local setup

Use Node.js 22 or newer. Run `npm ci`, copy `.env.example` to `.env.local`, and set the server-only values. Generate `AUTH0_SECRET` with `openssl rand -hex 32`. `APP_BASE_URL` is the Studio origin, without a path, query, or credentials. Configure a dedicated Neon development branch or local PostgreSQL database; never use production data for integration tests.

Run `npm run dev` and open http://localhost:3000. Production verification uses `npm run typecheck`, `npm run lint`, and `npm run build`; start the built application with `npm start`. Run unit tests with `npm test`.

Environment values are read and validated on the server only. Invalid configuration errors name missing/invalid variables but never include their values. Secrets must not use a public environment prefix or be committed to Git. `.env.local` is ignored; `.env.example` is a template, not working credentials.

Database migration, constraint verification, and data-preserving rollback instructions are in [docs/database.md](docs/database.md). Database integration tests require a disposable PostgreSQL instance and an explicit TEST_DATABASE_URL.
