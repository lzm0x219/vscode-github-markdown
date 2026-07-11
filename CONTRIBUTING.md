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
nub run package
nub scripts/verify/index.ts
```

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
