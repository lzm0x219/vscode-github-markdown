# GFM Host DOM Regression

## Scope

The host preview fixture covers the extension-owned GFM semantics that must be
observable in the final Markdown preview DOM:

- single- and double-tilde strikethrough, escaped delimiters, inline code, and
  unmatched/long tilde runs;
- all nine GFM Tagfilter tags while preserving allowed HTML, `details`, and
  `picture`;
- automatic direction on headings, paragraphs, lists, alerts, and footnotes,
  with explicit direction and code nodes left unchanged;
- footnote references and the rendered footnote section.

## Host matrix

| Host | Entry point | Coverage |
| --- | --- | --- |
| VS Code desktop minimum | `test:host:desktop` with `VSCODE_TEST_VERSION=1.74.0` | Extension-host Markdown output and renderer contribution |
| VS Code desktop stable | `test:host:desktop` with `VSCODE_TEST_VERSION=stable` | Extension-host Markdown output and renderer contribution |
| VS Code desktop pinned preview | `test:host:desktop:preview` | Final Webview DOM and client rendering |
| VS Code Web stable | `test:host:web` | Extension-host Markdown output and renderer contribution |
| VS Code Web pinned preview | `test:host:web:preview` | Final Webview DOM and client rendering |

The desktop and Web preview jobs use the same fixture and DOM assertions. The
minimum and stable desktop smoke jobs exercise the exported Markdown-it hook and
the VS Code Markdown renderer contribution, which is the compatible assertion
surface available inside an extension host.

## Evidence

Run the applicable checks from the repository root:

```sh
nub run test
nub run test:host:desktop
nub run test:host:web
nub run test:host:desktop:preview
nub run test:host:web:preview
```

The preview checks fail when a semantic marker is missing, a required element or
attribute is changed, a filtered tag reaches the final DOM as raw HTML, or an
unexpected direction attribute is added to code.
