import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // Unblock the real driver/query/service modules in plain-node tests.
      "server-only": path.resolve(__dirname, "vitest/server-only-stub.ts"),
    },
  },
});
