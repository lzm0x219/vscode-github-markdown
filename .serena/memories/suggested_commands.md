# Suggested Commands

- Toolchain: `mise install`; dependencies: `pnpm install`.
- Build/watch: `nub run build`, `nub run dev`.
- Unit tests: `nub run test`; watch: `nub run test:watch`; coverage: `nub run test:coverage`.
- Host checks: `nub run test:host:desktop`, `nub run test:host:web`; preview variants use the corresponding `:preview` commands.
- Parity: `nub run verify:parity`; remote probe/report commands are in package.json.
- Lint: `nubx oxlint .`; type-aware lint: `nubx oxlint --type-aware .`; format: `nubx oxfmt .`.
- Package: `nub run package`.
- Repository AGENTS.md requires every shell command to be prefixed with `rtk`; prefix each segment of a chain.
