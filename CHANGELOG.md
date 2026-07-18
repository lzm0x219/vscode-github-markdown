# Changelog

This file records notable changes that people can observe or act on when using the extension. Every entry follows the project-owned [`User-Facing Changelog Standard`](./docs/CHANGELOG_STYLE_GUIDE.md), and upcoming changes remain under `[Unreleased]` until publication.

---

## [Unreleased]

## [v4.3.0] - 2026-07-19

v4.3.0 makes GitHub Markdown previews follow VS Code color themes more naturally across desktop and web while preserving readable high-contrast and fixed Single mode behavior. Mermaid diagrams now stay synchronized with both built-in and external renderers.

### Themes and appearance

- System mode now follows the VS Code color theme applied to the Markdown preview on desktop and web, including high-contrast light and dark themes. Operating-system appearance changes affect the preview only when VS Code switches its active theme; Single mode remains fixed, and high-contrast previews keep readable background, text, links, and focus outlines.
- A new VS Code theme mode keeps GitHub Markdown structure and typography while using the active VS Code theme for preview colors on desktop and web. Mermaid theme synchronization uses Mermaid's matching `vscode` theme in this mode.

### Mermaid

- Mermaid theme synchronization now works with VS Code's built-in renderer on 1.121 or later as well as the external `markdown-mermaid` extension. Disabling synchronization or deactivating this extension restores only settings it still owns, preserving newer Mermaid theme choices.

## [v4.2.0] - 2026-07-15

v4.2.0 makes raw HTML, strikethrough syntax, and bidirectional text behave more like GitHub while preserving allowed HTML, literal Markdown syntax, code direction, and explicit direction settings.

### Markdown preview

- Arabic and other right-to-left or mixed-direction headings, paragraphs, lists, alerts, and footnotes now use GitHub-style automatic direction in the preview, while code and explicit direction settings remain unchanged.
- Raw HTML tags covered by GFM tagfilter, such as `<script>` and `<iframe>`, now appear as text in the preview instead of being interpreted as HTML. Other allowed HTML and project-root image paths continue to work.
- Text wrapped in single tildes now appears struck through to match GitHub, while double tildes, escapes, code spans, empty or unmatched markers, and longer tilde runs keep their existing behavior.

## [v4.1.1] - 2026-07-15

v4.1.1 keeps Mermaid diagrams aligned with both preview color schemes and restores your previous Mermaid preferences when synchronization is turned off. It also makes the extension easier to find and its installation, migration, and theme controls clearer.

### Mermaid

- When `markdown-mermaid` is installed and `githubMarkdown.mermaid.syncTheme` is enabled, Mermaid diagrams now stay aligned with the selected preview themes. Turning off synchronization restores your previous Mermaid light and dark theme settings.

### Installation and migration

- You can now follow a complete migration path from `lzm0x219.vscode-markdown-github`. [Install the new extension from the Marketplace](https://marketplace.visualstudio.com/items?itemName=lzm0x219.vscode-github-markdown) or run `code --install-extension lzm0x219.vscode-github-markdown`, verify the new preview, and then uninstall the previous extension to avoid overlapping preview customizations.

### Extension identity

- The extension now appears as **GitHub Flavored Markdown Preview**, and Marketplace search includes terms such as GFM and Markdown preview so its purpose is easier to recognize.

### Themes and appearance

- Theme commands and settings now use **Light** and **Dark** instead of **Day** and **Night**, and System mode descriptions clarify that it follows the Markdown preview's color scheme.

## [v4.1.0] - 2026-07-12

This release makes links easier to identify and improves the visual consistency of footnotes, emoji, and code with GitHub. Existing settings continue to work, and no migration is required.

### Accessibility

- Links in regular Markdown text are now underlined by default to match GitHub. Set `githubMarkdown.accessibility.linkUnderlines` to `false` to hide them.
- Footnote references and return links remain without underlines so they keep GitHub's distinct footnote appearance in either link setting.

### Markdown preview

- Consecutive footnote definitions now remain separate notes with the expected numbering instead of being combined into one definition.
- GitHub custom image emoji now align vertically with surrounding text and show their shortcode on hover. The `:warning:` shortcode now follows GitHub's emoji markup for more consistent rendering.
- Code blocks now use the typography supplied by the selected GitHub theme instead of always using the VS Code editor font.

### Extension identity

- The extension is now displayed as **GitHub Flavored Markdown** in VS Code and the Marketplace, making its purpose easier to recognize.

## [v4.0.0] - 2026-06-24

v4 is a new extension rather than an in-place update of `lzm0x219.vscode-markdown-github`; it rebuilds the GitHub-style preview around VS Code's built-in Markdown preview. Existing v3 users must install it separately, and anyone who wants to preserve their v3 theme behavior must migrate those settings manually.

### Action required

- **Breaking:** If you use `lzm0x219.vscode-markdown-github`, [install `lzm0x219.vscode-github-markdown` separately](https://marketplace.visualstudio.com/items?itemName=lzm0x219.vscode-github-markdown); VS Code does not update the previous extension ID in place. Confirm the v4 preview works, then disable or uninstall the previous extension so both extensions do not customize the preview together.
- **Breaking:** If you want to preserve your v3 theme behavior, migrate `vscode-markdown-github.theme.mode`, `vscode-markdown-github.theme.light`, and `vscode-markdown-github.theme.dark` because v4 does not read them. Map `light` to `githubMarkdown.theme.mode = single` and copy `vscode-markdown-github.theme.light` to `githubMarkdown.theme.single`; map `dark` to `githubMarkdown.theme.mode = single` and copy `vscode-markdown-github.theme.dark` to `githubMarkdown.theme.single`; map `auto` to `githubMarkdown.theme.mode = system`, copy `vscode-markdown-github.theme.light` to `githubMarkdown.theme.light`, and copy `vscode-markdown-github.theme.dark` to `githubMarkdown.theme.dark`.
- **Breaking:** If you rely on Mermaid diagrams, [install `markdown-mermaid` separately](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid). v4 no longer includes a Mermaid renderer; it only synchronizes the companion extension's theme.

### Markdown preview

- Task lists render as GitHub-style disabled checkboxes inside VS Code's built-in Markdown preview.
- GitHub alerts written with `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, or `[!CAUTION]` render with matching icons and colors.
- Emoji shortcodes such as `:rocket:`, `:+1:`, and `:tada:` render as Unicode or GitHub custom image emoji.
- Footnote references receive automatic numbering, return links, and a dedicated footnotes section.
- Project-root paths in HTML `<img>` tags are rewritten for the VS Code webview so local images can load in the preview.

### Themes and appearance

- Theme selection now uses **Single** mode for one fixed theme or **System** mode for separate light and dark choices across nine GitHub themes.
- The Command Palette provides separate controls for theme mode, the fixed theme, and the light and dark system themes.

### Mermaid

- When `markdown-mermaid` is installed, `githubMarkdown.mermaid.syncTheme` is enabled by default. On activation or after a GitHub Markdown setting changes, v4 updates one of the companion extension's `markdown-mermaid.lightModeTheme` or `markdown-mermaid.darkModeTheme` settings to Mermaid's `default` or `dark` theme.

### Installation and compatibility

- v4 supports VS Code 1.74 or later and continues to enhance the built-in Markdown preview instead of opening a separate preview editor.
- Commands and settings are available in English and Simplified Chinese according to the VS Code display language.

[v4.3.0]: https://github.com/lzm0x219/vscode-github-markdown/compare/v4.2.0...v4.3.0
[v4.2.0]: https://github.com/lzm0x219/vscode-github-markdown/compare/v4.1.1...v4.2.0
[v4.1.1]: https://github.com/lzm0x219/vscode-github-markdown/compare/v4.1.0...v4.1.1
[v4.1.0]: https://github.com/lzm0x219/vscode-github-markdown/compare/v4.0.0...v4.1.0
[v4.0.0]: https://github.com/lzm0x219/vscode-github-markdown/compare/v3.1.0...v4.0.0
[Unreleased]: https://github.com/lzm0x219/vscode-github-markdown/compare/v4.3.0...HEAD
