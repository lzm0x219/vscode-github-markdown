# Contributing

Thanks for contributing to `vscode-github-markdown`.

This project aims to make VS Code's Markdown preview match GitHub as closely as possible, so documentation authors can preview the expected GitHub result while editing locally.

## Before You Start

- Use VS Code `^1.74.0` or newer for local extension development
- Use [mise](https://mise.jdx.dev/) to install the project-managed Node.js and pnpm versions
- Use `pnpm` only for dependency installation
- Use [Nub](https://github.com/nubjs/nub) / `nubx` for project scripts and executable commands (`build`, `dev`, `verify`, lint, format)

Install the toolchain declared in [`mise.toml`](./mise.toml), then install dependencies:

```bash
mise install
pnpm install
```

If mise is not activated in your shell, prefix project commands with `mise exec --`, for example `mise exec -- pnpm install`.

Build the current extension bundle:

```bash
nub run build
```

To open the bundle visualizer after a build, pass the explicit option:

```bash
nub run build -- --open-visualizer
```

## Project Scope

Please keep changes tightly aligned with the project goal:

- Improve GitHub Markdown rendering parity
- Improve Markdown preview behavior inside VS Code
- Improve extension maintainability without adding speculative abstraction

Please avoid:

- Building a separate Markdown preview system when VS Code's built-in Markdown hooks are enough
- Adding features unrelated to GitHub Markdown parity
- Raising the minimum VS Code version unless the implementation truly requires newer APIs

## Repository Layout

- [`src/extension.ts`](./src/extension.ts): extension entrypoint
- [`package.json`](./package.json): manifest and Markdown preview contribution points
- [`README.md`](./README.md): default English documentation
- [`README.zh-CN.md`](./README.zh-CN.md): Simplified Chinese documentation
- [`AGENTS.md`](./AGENTS.md): repository-specific agent and implementation rules

## Development Notes

- Keep runtime code compatible with web extensions
- Prefer the built-in Markdown extension hooks already declared in `package.json`
- Avoid Node-only runtime APIs unless the manifest and compatibility target are intentionally changed

## Checks

Run scripts and executable commands with `nub` / `nubx` before opening a pull request:

```bash
nubx oxlint .
nubx oxlint --type-aware .
nubx oxfmt .
nub run test
nub run verify:parity
nub run package
nub scripts/verify/index.ts
```

## GitHub Markdown Parity Baseline

The visual parity check renders GitHub's committed HTML and CSS reference alongside the current local renderer and extension CSS in one headless Chromium instance. Both sides use the same viewport, theme, device scale, and content crop. It compares the resulting PNG files pixel by pixel, so visually equivalent HTML structures do not create false failures while CSS regressions remain visible.

- `nub run verify:parity` is offline and compares local light/dark screenshots with the committed GitHub-rendered reference.
- `nub run verify:parity:remote` calls GitHub's Markdown and Contents APIs, renders the current responses, and detects visual upstream drift. CI runs it weekly.
- GitHub, local, and highlighted diff images plus JSON and Markdown reports are written to `artifacts/parity` and uploaded by CI after a failure.
- Every baseline records hashes plus the GitHub source kind, repository path/ref, HTML normalization, comparison policy, reference CSS, and rendering configuration. A stale or incomplete baseline fails with instructions to refresh it.

When a local rendering change or upstream GitHub change is intentional, inspect the report and refresh the committed snapshots:

```bash
nub run update:parity
nub run verify:parity
```

When only rendering configuration changes and every complete case input already exists in the verified baseline, `nub run update:parity:offline` can synchronize metadata and reuse HTML by its source-aware input fingerprint. It fails instead of inventing output for a new input.

Set `GITHUB_TOKEN` when refreshing frequently to avoid unauthenticated API rate limits. Cases in `scripts/parity/cases.ts` are intentionally split by feature and theme. Exact cases use zero tolerance. Cases that depend on VS Code or GitHub client-side renderers use explicit non-zero budgets for total pixels, pixel ratio, and the largest connected difference area, so known host differences remain visible without disabling regression detection.

Repository-file baselines default to the committed `main` version. The refresh command resolves the requested ref to an immutable commit SHA, verifies that GitHub's raw file exactly matches the local fixture, and refuses to write a mixed baseline. For fixture changes on a pushed branch, refresh with `GITHUB_MARKDOWN_REF=your-branch nub run update:parity`. Contributors working from a fork should also set `GITHUB_MARKDOWN_REPOSITORY=owner/repository`. The committed baseline records the repository and resolved SHA as provenance, while stable case identity uses the source kind and file path, so verification remains valid after a fork branch is merged or deleted.

This repository also uses `lefthook` for pre-commit checks:

```bash
nubx lefthook run pre-commit
```

## Documentation

- `README.md` is the default English document
- `README.zh-CN.md` is the Simplified Chinese counterpart
- If you change shared user-facing project documentation, update both files unless the difference is intentionally language-specific
- Do not document features as implemented unless they already exist in the current codebase

## Pull Requests

Small, focused pull requests are preferred.

When possible:

- Keep one logical change per pull request
- Include a short explanation of why the change is needed
- Mention any compatibility impact, especially if it affects VS Code version support
- Note any checks you ran, or say clearly if you did not run them
