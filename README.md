<p align="right">
  <a href="./README.zh-CN.md">简体中文</a>
</p>

<h1 align="center">GitHub Markdown Preview</h1>

<p align="center">
  Make VS Code Markdown Preview match GitHub as closely as possible.
</p>

<p align="center">
  <img alt="VS Code ^1.74.0" src="https://badges.ws/badge/VS%20Code-%5E1.74.0-007ACC?logo=visualstudiocode&logoColor=white" />
  <img alt="Nub" src="https://badges.ws/badge/Nub-toolkit-f9f1e1" />
  <img alt="Oxc" src="https://badges.ws/badge/Oxc-Linter-32f3e9?logo=oxc&logoColor=white" />
  <img alt="License MIT" src="https://badges.ws/badge/License-MIT-3979E1" />
</p>

## Why This Project

VS Code's built-in Markdown Preview is a general-purpose renderer, but what developers actually care about is how their documentation will look once it lands on GitHub. This project is not trying to create a GitHub-like theme. Its goal is to align VS Code preview output with GitHub's Markdown preview behavior and presentation as closely as possible.

That makes README writing, docs authoring, and general Markdown editing much more predictable: developers can edit and preview locally while seeing something close to the final result they expect on GitHub, instead of discovering layout or rendering mismatches only after pushing.

This project focuses on two practical outcomes:

- Align the rendering, spacing, and visual details of GitHub Markdown instead of inventing a separate lookalike theme
- Keep local preview and expected GitHub output as close as possible so documentation work needs less trial and error
- Keep `markdown-mermaid` diagrams on a matching light or dark theme when Mermaid theme sync is enabled

## Features

### GitHub-Flavored Markdown

- **Task Lists** — `- [x]` and `- [ ]` render as GitHub-style disabled checkboxes.
- **Footnotes** — `[^1]` references with automatic numbering, backrefs, and a footnotes section at the bottom.
- **Alerts** — `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]` render with proper icons and styling.
- **Emoji Shortcodes** — `:rocket:`, `:+1:`, `:tada:` and thousands more, including both Unicode emoji and image-based custom emoji from GitHub.
- **HTML Image Path Rewriting** — absolute paths in HTML `<img>` tags (`/path/to/img`) are rewritten to relative paths (`./path/to/img`), so project-local images work correctly in VS Code's webview preview.

### GitHub Themes

9 built-in GitHub themes, covering light, dark, dimmed, high contrast, and colorblind-friendly variants:

| Light                           | Dark                           |
| ------------------------------- | ------------------------------ |
| Light                           | Dark                           |
| Light Protanopia & Deuteranopia | Dark Protanopia & Deuteranopia |
| Light high contrast             | Dark high contrast             |
| Light Tritanopia                | Dark dimmed                    |
|                                 | Dark Tritanopia                |

Two theme modes:

- **Single** — always use one fixed theme.
- **System** — follow the preview's light/dark color scheme, with separate themes for each.

Switch themes anytime via VS Code commands (Quick Pick) — no need to open settings.

### Mermaid Diagrams

When `githubMarkdown.mermaid.syncTheme` is enabled, the extension updates the `markdown-mermaid` light/dark theme settings to match the active GitHub Markdown theme. It does not ship a Mermaid renderer or add a Mermaid dependency.

## Related Information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [Emoji Cheat Sheet](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

This project is licensed under the terms of the [MIT](./LICENSE) open source license.
