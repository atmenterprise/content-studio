import { describe, expect, it } from "vitest";
import { parseEnvironment } from "../lib/env";
const valid = {
  DATABASE_URL: "postgresql://postgres:secret@localhost:5432/studio",
  AUTH0_DOMAIN: "example.eu.auth0.com", AUTH0_CLIENT_ID: "client",
  AUTH0_CLIENT_SECRET: "private-secret-value", AUTH0_SECRET: "a".repeat(64),
  AUTH0_AUDIENCE: "https://studio.example/api", APP_BASE_URL: "http://localhost:3000",
};
describe("server environment", () => {
  it("accepts server configuration", () => expect(parseEnvironment(valid).AUTH0_DOMAIN).toBe(valid.AUTH0_DOMAIN));
  it("names missing variables without exposing values", () => {
    expect(() => parseEnvironment({ ...valid, AUTH0_SECRET: "secret-marker", DATABASE_URL: "invalid-password-marker" })).toThrow("DATABASE_URL, AUTH0_SECRET");
    try { parseEnvironment({ ...valid, AUTH0_SECRET: "secret-marker" }); } catch (error) { expect(String(error)).not.toContain("secret-marker"); }
  });
  it.each(["https://user:pass@example.com", "http://example.com", "https://example.com/path", "https://example.com/?token=secret"])("rejects unsafe app origin %s", value => expect(() => parseEnvironment({ ...valid, APP_BASE_URL: value })).toThrow("APP_BASE_URL"));
});
