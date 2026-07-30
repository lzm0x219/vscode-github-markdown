# Core

- VS Code web-compatible Markdown preview extension; runtime uses built-in markdown extension hooks, not a custom preview.
- Runtime entry: src/extension.ts registers theme commands, configuration events, Mermaid theme integration, and one ordered markdown-it plugin chain.
- Plugin order is an observable invariant: strikethrough, tagfilter, task lists, alerts, emoji, footnotes, directionality, theme wrapper, image URL rewrite.
- Runtime must remain browser-compatible because package.json declares both main and browser as dist/extension.js.
- Script/tooling domains live under scripts/: build, drift, emoji, host, package-audit, parity, release, shared, verify.
- Read `mem:tech_stack` for pinned toolchain, `mem:conventions` for repository-specific design rules, and `mem:task_completion` before finishing changes.
