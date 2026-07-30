# Task Completion

- Run the narrowest relevant Vitest file(s), then `nub run test` when runtime or shared scripts changed.
- Run `nubx oxlint .` and `nubx oxlint --type-aware .` for TypeScript changes.
- Run `nubx oxfmt .` or its check equivalent as appropriate; do not overwrite unrelated user formatting.
- Run `nub run build` for runtime/build configuration changes.
- Run `nub run verify:parity` for Markdown rendering/parity changes.
- Run relevant desktop and web host checks when extension-host behavior or compatibility changes.
- Evaluate CHANGELOG admission for every change; update [Unreleased] only for eligible user-visible outcomes.
- Recheck git status/diff before finishing and preserve unrelated worktree changes.
