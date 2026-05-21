import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./server/tests/setup.ts"],
    env: { DATABASE_URL: "file:./prisma/test_fresh.db" },
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
