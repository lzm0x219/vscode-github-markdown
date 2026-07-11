# Changelog

All notable changes to this extension are documented in this file. Release notes are written for people and maintained manually under `[Unreleased]` until publication.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Legend: ✨ Feature · 💎 Improve · 🧱 Refactor · 🐛 Bugfix · 💥 Breaking · 🚧 Maintenance · 📦 Dependencies · 🚀 Performance · 📝 Documentation

---

## [Unreleased]

### ✨ Feature

- Add an accessibility setting for showing or hiding link underlines in Markdown text blocks, enabled by default to match GitHub.

### 💎 Improve

- Rename the extension's display name to **GitHub Flavored Markdown** across the manifest, localization files, and documentation.
- Align GitHub emoji wrappers and custom image metadata, consecutive footnote definitions, code typography, and footnote link decoration with GitHub rendering.

### 🧱 Refactor

- Reorganize build, emoji, release, and verification scripts into domain-focused modules with deterministic generation and focused tests.

### 🚧 Maintenance

- Add strict pixel-level Markdown parity baselines, local regression checks, weekly GitHub renderer drift detection, and CI diff artifacts.
- Add a mise-managed development toolchain with Node.js 24 and pnpm 11.
- Provision the project toolchain through mise in CI and publishing workflows.
- Upgrade to TypeScript 7 and simplify the compiler configuration for the current build pipeline.
- Remove the deprecated `@typescript/native-preview` development dependency.
- Make CSS watch rebuilds recover from initial failures and process rapid changes reliably.
- Keep the bundle visualizer closed by default and open it only with `--open-visualizer`.

### 📦 Dependencies

- Update pnpm, markdown-it, tsdown, Vitest, lefthook, oxlint, oxfmt, and related development dependencies.

### 📝 Documentation

- Document mise setup and usage in the contribution guide.

## [v4.0.0]

v4 is a ground-up rewrite. The extension has been renamed from `vscode-markdown-github` to **vscode-github-markdown** and rebuilt as a chain of focused `markdown-it` plugins that plug into VS Code's built-in Markdown preview pipeline. The theme system now offers 9 GitHub themes with preview light/dark switching, and the entire build toolchain has been modernized.

### 💥 Breaking

- **Extension renamed** — `vscode-markdown-github` → `vscode-github-markdown`. This is a new extension; install it separately.
- **Architecture** — a `markdown-it` plugin chain registered via `markdown.markdownItPlugins` replaces the previous standalone renderer.
- **VS Code** — minimum version raised to `^1.74.0`.
- **Node.js** — 22+ for development. Runtime stays web-extension compatible.
- **Build & lint** — Nub + tsdown replaces webpack/esbuild. oxlint + oxfmt + lefthook replaces eslint.
- **Theme config** — `mode` (single / system) with per-mode theme selection replaces the old three-option model.

### ✨ Feature

**GitHub-Flavored Markdown rendering.** Five `markdown-it` plugins correct VS Code's built-in output to match GitHub:

- **Task Lists** — `- [x]` and `- [ ]` render as GitHub-style disabled checkboxes.
- **Alerts** — `[!NOTE]` / `[!TIP]` / `[!IMPORTANT]` / `[!WARNING]` / `[!CAUTION]` with proper icons and colors.
- **Emoji** — `:rocket:` / `:+1:` / `:tada:` and thousands more, plus GitHub custom emoji.
- **Footnotes** — `[^1]` with automatic numbering, backrefs, and a dedicated section.
- **HTML image paths** — absolute paths in HTML `<img>` tags (`/path/to/img`) rewritten to relative (`./path/to/img`) for correct webview loading.

**Themes.** 9 built-in themes generated from `generate-github-markdown-css`: Light, Dark, Dark dimmed, Light/Dark high contrast, Light/Dark Protanopia & Deuteranopia, Light/Dark Tritanopia. Two modes — _Single_ (one fixed theme) or _System_ (follows the preview light/dark color scheme). Switch themes anytime via Quick Pick commands (`changeThemeMode`, `changeSingleTheme`, `changeLightTheme`, `changeDarkTheme`).

**Mermaid.** When `githubMarkdown.mermaid.syncTheme` is enabled, the extension maps the active GitHub Markdown theme to the `markdown-mermaid` light/dark theme settings. It does not bundle a Mermaid renderer.

**i18n.** All user-facing strings externalized via `@vscode/l10n`.

**Verification.** `nub scripts/verify-github-markdown.ts` validates the full rendering pipeline against comprehensive GFM test fixtures.

### 🧱 Refactor

Four-layer architecture documented in [`ARCHITECTURE.md`](./ARCHITECTURE.md):

```txt
Manifest & Contribution → Extension Host → Markdown Transform → Preview Presentation
```

Each GitHub behavior is isolated in its own plugin under `src/plugins/`. The configuration surface is deliberately minimal: theme selection and Mermaid sync. Preview styles and scripts are injected through standard VS Code contribution points — no custom rendering pipeline.

### 📦 Dependencies

| Area           | Before                               | After                             |
| -------------- | ------------------------------------ | --------------------------------- |
| CSS generation | `@primer/css` + `@primer/primitives` | `generate-github-markdown-css`    |
| Build          | webpack / esbuild                    | `nub` + `tsdown` + `lightningcss` |
| Lint & format  | eslint                               | `oxlint` + `oxfmt` + `lefthook`   |
| Dev tooling    | —                                    | `@vscode/vsce` + `publint`        |

### 📝 Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — design, layers, constraints, and non-goals.
- [`README.md`](./README.md) / [`README.zh-CN.md`](./README.zh-CN.md) — features, theme table, and Mermaid sync behavior.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) — toolchain setup and contribution guidelines.
- [`AGENTS.md`](./AGENTS.md) — rules for automated tooling.

[Unreleased]: https://github.com/lzm0x219/vscode-github-markdown/compare/v4.0.0...HEAD
[v4.0.0]: https://github.com/lzm0x219/vscode-github-markdown/compare/v3.1.0...v4.0.0
