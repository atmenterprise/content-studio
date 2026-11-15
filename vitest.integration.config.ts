import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "server-only": fileURLToPath(new URL("./tests/server-only.ts", import.meta.url)), "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: { include: ["tests/integration/**/*.test.ts"], fileParallelism: false, testTimeout: 15000, hookTimeout: 15000 },
});
