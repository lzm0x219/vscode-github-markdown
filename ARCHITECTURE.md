# Architecture

This extension narrows the gap between VS Code's built-in Markdown preview and GitHub. It augments the host preview through supported contribution points rather than owning a renderer or webview.

## Runtime Flow

```text
package.json contributions
  ├─ markdown.markdownItPlugins ──> src/extension.ts ──> focused markdown-it plugins
  └─ markdown.previewStyles ──────> dist/extension.preview.css

VS Code configuration changes ───> src/events.ts ──> preview refresh + Mermaid sync
VS Code commands ────────────────> src/commands.ts ──> theme configuration
```

`activate` registers every command and configuration listener in the extension context, then returns `extendMarkdownIt`. VS Code calls that hook with its own `markdown-it` instance. The plugin order is intentional:

1. GitHub-compatible strikethrough
2. GFM tagfilter
3. task lists
4. alerts
5. emoji
6. footnotes
7. theme metadata
8. HTML image URL rewriting

Each behavior lives under `src/plugins/`. Plugins transform tokens or renderer rules while the built-in preview remains responsible for document lifecycle, webview security, syntax highlighting, and navigation.

## Presentation and Themes

`src/extension.preview.css` is the authored entrypoint. The build combines it with a committed snapshot of GitHub Markdown styles and nine theme variable sets, then writes `dist/extension.preview.css`.

Normal builds are deliberately offline. `scripts/build/github-css.ts` extracts build assets from `tests/fixtures/parity-reference.css`; within the CSS and parity workflows, only explicit refresh and remote-verification commands contact GitHub. Other maintenance commands, such as emoji metadata updates, may contact GitHub independently. This keeps local builds and pull-request CI independent of GitHub availability and unauthenticated API quotas.

Theme metadata written by `src/plugins/markdown-it-github-theme.ts` selects either one fixed theme or separate light and dark themes through CSS media queries. Runtime code does not infer light or dark mode from the clock.

## Mermaid Integration

Mermaid rendering belongs to the separate `markdown-mermaid` extension. If its configuration keys exist and `githubMarkdown.mermaid.syncTheme` is enabled, this extension maps the selected GitHub themes to both `markdown-mermaid.lightModeTheme` and `markdown-mermaid.darkModeTheme`.

Before the first update, the original global values are stored in extension global state. Disabling synchronization restores those values and removes the snapshot. If `markdown-mermaid` is absent, synchronization is a no-op. No Mermaid runtime is bundled.

## Verification Boundaries

- Unit tests cover plugins, commands, configuration events, Mermaid state restoration, and build/parity helpers.
- `scripts/verify` checks the complete Markdown transformation and manifest boundaries.
- Pixel parity renders committed GitHub reference input and local output in the same Chromium process. Exact cases use zero tolerance; host-rendered features use explicit recorded budgets.
- Desktop host smoke tests run against VS Code 1.74.0 and stable. A browser-host smoke test protects the `browser` entrypoint and the no-Node-runtime constraint. These tests activate the extension, render through VS Code's built-in Markdown engine so the `markdown.markdownItPlugins` contribution is exercised, and verify the contributed preview stylesheet exists.
- Packaging verifies the Marketplace artifact after the code and visual checks pass.

## Compatibility and Non-goals

Both `main` and `browser` point to the same extension bundle. Runtime modules under `src/` therefore avoid Node-only APIs. Node APIs are allowed in development scripts under `scripts/` and test tooling.

The project does not:

- replace VS Code's Markdown preview or create a custom webview;
- bundle Mermaid or other client-side diagram renderers;
- promise pixel identity for visuals owned by a host application without an explicit measured budget;
- raise the minimum VS Code version unless a required runtime API demands it.
