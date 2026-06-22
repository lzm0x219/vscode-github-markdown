# Project: vscode-github-markdown

## Goal

This project is a VS Code extension that makes local Markdown preview match GitHub as closely as possible, so developers can write documentation and preview the expected GitHub result while editing.

## Stack

- TypeScript
- VS Code extension API
- Markdown preview contribution points
- pnpm
- Bun
- oxlint + oxfmt
- lefthook

## Key Files

- [`package.json`](./package.json): extension manifest, contribution points, engine constraints
- [`src/extension.ts`](./src/extension.ts): extension entrypoint
- [`README.md`](./README.md): default English documentation
- [`README.zh-CN.md`](./README.zh-CN.md): Simplified Chinese documentation
- [`tsconfig.json`](./tsconfig.json): strict TypeScript config
- [`lefthook.yml`](./lefthook.yml): pre-commit checks

## Commands

- Install dependencies: `pnpm install`
- Build: `pnpm run build`
- Dev watch: `pnpm run dev`
- Verify GitHub Markdown: `bun scripts/verify-github-markdown.ts`
- Test: `pnpm run test`
- Test watch: `pnpm run test:watch`
- Package: `pnpm run package`
- Lint: `pnpm exec oxlint .`
- Type-aware lint: `pnpm exec oxlint --type-aware .`
- Format: `pnpm exec oxfmt .`

## Implementation Rules

- Keep runtime code compatible with web extensions. `package.json` uses both `main` and `browser`, so avoid Node-only APIs in extension runtime code unless the manifest is updated intentionally.
- Prefer the built-in Markdown extension hooks already declared in `package.json`:
  - `markdown.markdownItPlugins`
  - `markdown.previewScripts`
  - `markdown.previewStyles`
- Do not introduce a custom preview system if the built-in Markdown preview hooks can solve the problem.
- Keep changes minimal and directly tied to GitHub Markdown parity. Avoid speculative theme systems or configuration layers.

## Documentation Rules

- `README.md` is the default English document.
- `README.zh-CN.md` is the Simplified Chinese counterpart.
- When updating shared project-facing documentation, keep both files aligned unless the change is intentionally language-specific.
- Do not claim a feature is implemented unless it exists in the current codebase.

## Versioning Rules

- Treat `engines.vscode` as the minimum supported version, not the development version.
- Do not raise the minimum VS Code version unless the implementation requires APIs or behavior from a newer release.

## Before Finishing

- Run the relevant lint/format commands for touched files when practical.
- Keep scope tight. If a task only needs docs or manifest changes, do not expand into runtime refactors.
