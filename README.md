<p align="right">
  <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/readme-banner-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./assets/readme-banner.png">
    <img alt="Isometric Markdown source and GitHub preview connected by green contribution blocks" src="./assets/readme-banner.png">
  </picture>
</p>

<h1 align="center">GitHub Flavored Markdown Preview</h1>

<p align="center">
  Make VS Code Markdown Preview match GitHub as closely as possible.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=lzm0x219.vscode-github-markdown"><img alt="VS Marketplace version" src="https://badges.ws/vscode/v/lzm0x219.vscode-github-markdown?label=Marketplace&labelColor=24292F" /></a>
  <a href="#desktop-and-web"><img alt="Desktop and web extension hosts" src="https://badges.ws/badge/Hosts-Desktop%20%2B%20Web-BC4C00?labelColor=24292F" /></a>
  <a href="https://github.com/lzm0x219/vscode-github-markdown/actions/workflows/ci.yml"><img alt="CI status" src="https://badges.ws/github/actions/workflow/status/lzm0x219/vscode-github-markdown/ci.yml?branch=main&label=CI&labelColor=24292F" /></a>
  <a href="./LICENSE"><img alt="MIT license" src="https://badges.ws/badge/License-MIT-8250DF?labelColor=24292F" /></a>
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=lzm0x219.vscode-github-markdown"><strong>Install from Visual Studio Marketplace</strong></a>
</p>

## Quick Start

Install the extension from the Marketplace link above or from a terminal:

```shell
code --install-extension lzm0x219.vscode-github-markdown
```

Open a Markdown file, then run **Markdown: Open Preview to the Side**. The built-in VS Code preview gains GitHub-compatible rendering and styling; no separate preview editor is introduced.

<table>
  <tr>
    <th>GitHub reference</th>
    <th>Extension renderer</th>
  </tr>
  <tr>
    <td><img alt="Markdown rendered by GitHub" src="./assets/parity-github.png" /></td>
    <td><img alt="Markdown rendered by the extension pipeline" src="./assets/parity-vscode.png" /></td>
  </tr>
</table>

These images come from the automated parity harness, which renders the committed GitHub reference and the extension's Markdown/CSS pipeline under identical Chromium conditions. Real VS Code desktop and web hosts are covered separately by smoke tests of the built-in Markdown renderer contribution.

> [!IMPORTANT]
> Migrating from `lzm0x219.vscode-markdown-github`? This is a separate extension ID. Install `lzm0x219.vscode-github-markdown`, confirm your Markdown preview works as expected, and then uninstall the old extension to avoid overlapping preview customizations.

## Why This Project

VS Code's built-in Markdown Preview is a general-purpose renderer, but what developers actually care about is how their documentation will look once it lands on GitHub. This project is not trying to create a GitHub-like theme. Its goal is to align VS Code preview output with GitHub's Markdown preview behavior and presentation as closely as possible.

That makes README writing, docs authoring, and general Markdown editing much more predictable: developers can edit and preview locally while seeing something close to the final result they expect on GitHub, instead of discovering layout or rendering mismatches only after pushing.

This project focuses on three practical outcomes:

- Align the rendering, spacing, and visual details of GitHub Markdown instead of inventing a separate lookalike theme
- Keep local preview and expected GitHub output as close as possible so documentation work needs less trial and error
- Keep diagrams from VS Code's built-in Mermaid renderer or `markdown-mermaid` on a matching light or dark theme when Mermaid theme sync is enabled

## Features

### GitHub-Flavored Markdown

- **Task Lists** — `- [x]` and `- [ ]` render as GitHub-style disabled checkboxes.
- **Strikethrough** — `~text~` renders as GitHub-style strikethrough while existing `~~text~~` syntax, escapes, and inline code remain intact.
- **GFM Tagfilter** — raw tags such as `<title>`, `<script>`, and `<iframe>` appear as text to match GitHub, while allowed HTML remains rendered.
- **Automatic Text Direction** — Arabic and other right-to-left or mixed-direction content follows GitHub's automatic direction, while code and explicit directions remain unchanged.
- **Footnotes** — `[^1]` references with automatic numbering, backrefs, and a footnotes section at the bottom.
- **Alerts** — `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, and `[!CAUTION]` render with proper icons and styling.
- **Emoji Shortcodes** — `:rocket:`, `:+1:`, `:tada:` and thousands more, including both Unicode emoji and image-based custom emoji from GitHub.
- **HTML Image Path Rewriting** — absolute paths in HTML `<img>` tags (`/path/to/img`) are rewritten to relative paths (`./path/to/img`), so project-local images work correctly in VS Code's webview preview.

### Pixel-Verified Preview Parity

Automated Chromium checks compare GitHub reference rendering with the extension preview pixel by pixel. Controllable Markdown fixtures use zero tolerance, so changes to spacing, typography, colors, link decoration, or content dimensions fail the regression check.

VS Code syntax highlighting and GitHub client-side renderers for Mermaid, GeoJSON, STL, and math use separate regression budgets because the host applications produce those visuals. These boundaries remain measured and fail when their differences exceed the recorded limits.

### GitHub Themes

9 built-in GitHub themes, covering light, dark, dimmed, high contrast, and colorblind-friendly variants:

| Light                           | Dark                           |
| ------------------------------- | ------------------------------ |
| Light                           | Dark                           |
| Light Protanopia & Deuteranopia | Dark Protanopia & Deuteranopia |
| Light high contrast             | Dark high contrast             |
| Light Tritanopia                | Dark dimmed                    |
|                                 | Dark Tritanopia                |

Three theme modes:

- **Single** — always use one fixed theme.
- **System** — follow the preview's light/dark color scheme, with separate themes for each.
- **VS Code** — use colors from the active VS Code theme.

System mode follows the VS Code color theme applied to the Markdown preview on both desktop and web. Light and high-contrast light previews use the selected GitHub light theme; dark and high-contrast dark previews use the selected GitHub dark theme. Switching the VS Code theme updates the preview, while changing the operating-system appearance only affects it when VS Code is configured to detect that change and switches its active theme. Single mode ignores all of these signals and keeps its selected theme.

VS Code mode keeps GitHub's Markdown structure and typography while sourcing the preview's background, text, muted text, links, borders, selection, status, syntax, and focus colors from the active VS Code theme. Theme changes update desktop and web previews without a reload. High-contrast previews use the corresponding VS Code colors for readability.

Switch themes anytime via VS Code commands (Quick Pick) — no need to open settings.

### Mermaid Diagrams

On VS Code 1.121 or later, Mermaid theme sync works with the built-in `vscode.mermaid-markdown-features` extension. On older supported releases, install the external `bierner.markdown-mermaid` extension. When either renderer is available and `githubMarkdown.mermaid.syncTheme` is enabled, this extension updates their shared `markdown-mermaid` light and dark theme settings. System mode maps the selected GitHub light and dark themes independently; single mode applies one matching Mermaid theme to both slots; VS Code mode applies Mermaid's `vscode` theme to both slots. Disabling sync or deactivating this extension restores only the values it last applied, so newer Mermaid theme choices remain intact. This extension does not ship a Mermaid renderer or add a Mermaid runtime dependency.

### Desktop and Web

The runtime is compatible with desktop and web extension hosts. CI smoke-tests the minimum supported VS Code desktop version, the current stable desktop host, and the stable browser host.

### Accessibility

Text-block links are underlined by default, matching GitHub's default accessibility setting. Set `githubMarkdown.accessibility.linkUnderlines` to `false` to hide link underlines. Footnote references and back links remain undecorated in either mode.

## Related Information

- [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
- [Markdown Syntax Reference](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [Emoji Cheat Sheet](https://github.com/ikatyang/emoji-cheat-sheet/blob/master/README.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup and guidelines.

## License

This project is licensed under the terms of the [MIT](./LICENSE) open source license.
