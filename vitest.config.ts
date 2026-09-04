import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/helpers/temporal-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.ts", "scripts/**/*.ts"],
      exclude: [
        "src/generated/**",
        // Command entrypoints delegate to the script modules covered below.
        "scripts/build/index.ts",
        "scripts/case-folding/index.ts",
        "scripts/drift/index.ts",
        "scripts/emoji/index.ts",
        "scripts/package-audit/index.ts",
        "scripts/parity/index.ts",
        "scripts/release/index.ts",
        "scripts/verify/index.ts",
        "scripts/drift/drill-index.ts",
        "scripts/release/gate-index.ts",
        // Host launch and browser-driving harnesses require their real VS Code environment.
        "scripts/host/desktop-preview.ts",
        "scripts/host/desktop.ts",
        "scripts/host/preview.ts",
        "scripts/host/web-preview.ts",
        "scripts/host/web.ts",
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
