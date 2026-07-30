import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts", "scripts/**/*.ts"],
      exclude: [
        "src/generated/**",
        // Command entrypoints delegate to the script modules covered below.
        "scripts/**/index.ts",
        "scripts/drift/drill-index.ts",
        "scripts/release/gate-index.ts",
        // These harnesses are exercised by their real host and verification jobs.
        "scripts/host/**",
        "scripts/verify/**"
      ],
      thresholds: {
        "src/**/*.ts": {
          statements: 90,
          branches: 80,
          functions: 85,
          lines: 90
        },
        "scripts/**/*.ts": {
          statements: 70,
          branches: 65,
          functions: 75,
          lines: 70
        }
      }
    }
  }
});
