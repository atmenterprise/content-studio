import "server-only";
import { z } from "zod";

function isUrl(value: string, check: (url: URL) => boolean) {
  try { return check(new URL(value)); } catch { return false; }
}

const environment = z.object({
  DATABASE_URL: z.string().refine(value => isUrl(value, url => ["postgres:", "postgresql:"].includes(url.protocol))),
  AUTH0_DOMAIN: z.string().min(1).refine(value => /^[a-z0-9.-]+$/i.test(value) && !value.includes("..")),
  AUTH0_CLIENT_ID: z.string().min(1),
  AUTH0_CLIENT_SECRET: z.string().min(1),
  AUTH0_SECRET: z.string().regex(/^[a-f0-9]{64,}$/i),
  AUTH0_AUDIENCE: z.string().url(),
  APP_BASE_URL: z.string().refine(value => isUrl(value, url => {
    return !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash
      && (url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost"));
  })),
});

export function parseEnvironment(input: Record<string, string | undefined>) {
  const parsed = environment.safeParse(input);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map(issue => issue.path[0]))].join(", ");
    throw new Error(`Missing or invalid server configuration: ${fields}. See .env.example.`);
  }
  return parsed.data;
}
export function getEnvironment() { return parseEnvironment(process.env); }
