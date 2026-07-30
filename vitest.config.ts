import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts", "scripts/**/*.ts"],
      exclude: ["src/generated/**"],
      thresholds: {
        statements: 65,
        branches: 60,
        functions: 70,
        lines: 65
      }
    }
  }
});
