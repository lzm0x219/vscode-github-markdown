# Change Log

All notable changes to the "vscode-markdown-github" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

> Changelog Tags:
>
> - ✨ Feature
> - 💎 Improve
> - 🧱 Refactor
> - 🐛 Bugfix
> - 💥 Breaking
> - 🚧 Maintenance
> - 📦 Dependencies
> - 🚀 Performance
> - 📝 Documentation

## [v3.1.0] (2023-06-05)

### ✨ Feature

- Add mermaid diagrams preview.

## [v3.0.0] (2023-05-25)

### ✨ Feature

- Add "Note" and "Warning" support for blockquote.

### 💥 Breaking

- The specified compatible VS Code version is changed to 1.78.0 and above.

### 🧱 Refactor

- Refactored the writing of events and commands.

### 📦 Dependencies

- Updated all project dependency versions.

## [v2.0.1] (2023-01-04)

### 💎 Improve

- Add img tag path compatibility ([#80](https://github.com/lzm0x219/vscode-markdown-github/pull/80))

### 📦 Dependencies

- Update dependency @vscode/vsce to v2.16.0 ([#70](https://github.com/lzm0x219/vscode-markdown-github/pull/70))
- Update dependency @types/node to v18.11.18 ([#71](https://github.com/lzm0x219/vscode-markdown-github/pull/71))
- Update dependency esbuild-sass-plugin to v2.4.5 ([#75](https://github.com/lzm0x219/vscode-markdown-github/pull/75)))
- Update dependency @primer/view-components to v0.0.117 ([#76](https://github.com/lzm0x219/vscode-markdown-github/pull/76)))
- Update dependency esbuild to v0.16.13 ([#78](https://github.com/lzm0x219/vscode-markdown-github/pull/78)))
- Update dependency husky to v8.0.3 ([#79](https://github.com/lzm0x219/vscode-markdown-github/pull/79)))

### 🚧 Maintenance

- Update events registration methods

### 📝 Documentation

- Added description of the preview theme

## [v2.0.0] (2022-12-20)

### ✨ Feature

- Support all themes of Github.
- Support copying of code blocks.
- Support localization.

### 💥 Breaking

- Refactored theme configuration. (There are now three options, Theme Mode, Light Theme, and Dark Theme)
- Deprecated the ability to sync editor themes.

### 🚧 Maintenance

- Update dependency @types/node to v18.11.17.
- Update dependency esbuild to v0.16.9.

## [v1.2.0] (2022-12-14)

### ✨ Feature

- Add commands and configure changes to preview themes.
- Add the ability to automatically adapt to the editor's theme.

### 🚧 Maintenance

- Update codacy/codacy-analysis-cli-action digest to c4be364.

## [v1.1.3] (2022-12-12)

### 💎 Improve

- Supported to version 1.41 and above.

## [v1.1.2] (2022-12-12)

### 🚧 Maintenance

- Fixed invalid release CI.

## [v1.1.1] (2022-12-12)

### 🚧 Maintenance

- Updated script for release CI.

## [v1.1.0] (2022-12-12)

### 💎 Improve

- Optimized the number of build files.

### 🚧 Maintenance

- Added github's dependency-review CI
- Added github's codacy security scan CI
- Added github's codeQL CI
- Added github's publish CI

## [v1.0.0] (2022-12-12)

### ✨ Feature

- Added full github markdown preview style. 🎉

[v3.1.0]: https://github.com/lzm0x219/vscode-markdown-github/compare/v3.0.0...v3.1.0
[v3.0.0]: https://github.com/lzm0x219/vscode-markdown-github/compare/v2.0.1...v3.0.0
[v2.0.1]: https://github.com/lzm0x219/vscode-markdown-github/compare/v2.0.0...v2.0.1
[v2.0.0]: https://github.com/lzm0x219/vscode-markdown-github/compare/v1.2.0...v2.0.0
[v1.2.0]: https://github.com/lzm0x219/vscode-markdown-github/compare/v1.1.3...v1.2.0
[v1.1.3]: https://github.com/lzm0x219/vscode-markdown-github/compare/v1.1.2...v1.1.3
[v1.1.2]: https://github.com/lzm0x219/vscode-markdown-github/compare/v1.1.1...v1.1.2
[v1.1.1]: https://github.com/lzm0x219/vscode-markdown-github/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/lzm0x219/vscode-markdown-github/compare/v1.0.0...v1.1.0
[v1.0.0]: https://github.com/lzm0x219/vscode-markdown-github/releases/tag/v1.0.0
