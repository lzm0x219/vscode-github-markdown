# Tech Stack

- TypeScript with strict, isolatedModules, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitOverride, noPropertyAccessFromIndexSignature; ES2023 + Bundler resolution.
- VS Code extension API minimum comes from engines.vscode; @types/vscode matches that minimum and is not the development-host version.
- pnpm + mise manage the toolchain; Nub runs TypeScript scripts directly.
- markdown-it supplies parsing/rendering; Vitest + V8 coverage; oxlint/tsgolint + oxfmt; lefthook pre-commit.
- tsdown bundles the extension and host smoke tests; Playwright/pixelmatch support parity and preview validation.
