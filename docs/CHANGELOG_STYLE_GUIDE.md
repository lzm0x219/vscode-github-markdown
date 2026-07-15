# User-Facing Changelog Standard

- Status: Active
- Version: 1.0
- Effective: 2026-07-15

This is the project-owned standard for writing `CHANGELOG.md`. It applies to `[Unreleased]` and every release published after its effective date. Older release entries remain historical records and do not need to be rewritten solely to match this standard.

The standard is informed by [Keep a Changelog](https://keepachangelog.com/en/2.0.0/) and [Semantic Versioning](https://semver.org/spec/v2.0.0.html), but its content model is deliberately organized around the experience of people using the extension rather than development activity or commit types.

The words **must**, **should**, and **may** describe requirements, recommendations, and optional practices in this document.

## Purpose and Audience

The changelog helps someone decide whether to install or update the extension and understand what the update means for their Markdown preview.

Every entry must make the first two answers clear. It must answer the third whenever an action is required:

1. What will I notice after updating?
2. When or where will I notice it?
3. Do I need to change anything?

`CHANGELOG.md` is the canonical release record. GitHub Release notes are generated from the matching version section, so each release section must also make sense when read outside the repository.

## Admission Rules

A change belongs in the changelog when it materially affects at least one of these user outcomes:

- Rendered Markdown or its visual parity with GitHub
- Preview interaction, appearance, accessibility, or reliability
- Commands, settings, defaults, or other extension behavior
- Installation, migration, supported VS Code versions, or compatibility with another extension
- User-observable performance, resource usage, security, or privacy
- Documentation that enables a significant installation, migration, configuration, or troubleshooting task

The changelog must not include a change that is only about:

- Refactoring or code organization
- Tests, fixtures, coverage, or verification infrastructure
- CI, publishing, packaging, or development tooling
- Dependency or lockfile maintenance
- Formatting, comments, or routine documentation cleanup

If internal work produces a user-observable result, document only that result. Do not document the implementation work that produced it.

When uncertain, use this test:

> If the implementation details and pull request disappeared, could someone using the extension still observe or act on this change?

If the answer is no, omit it.

## Release Structure

Use these headings:

```markdown
## [Unreleased]

### Markdown preview

- ...

## [v4.2.0] - 2026-07-15

One or two sentences describing the release's main user outcome.

### Action required

- ...

### Markdown preview

- ...

### Themes and appearance

- ...

### Known limitations

- ...
```

The following rules apply:

- Published release headings must use `## [vVERSION] - YYYY-MM-DD`. When preparing that release, `VERSION` must equal the value in `package.json`, and `vVERSION` must equal the Git tag. Historical headings retain the version they were released with.
- `[Unreleased]` has no date and does not require a summary.
- A published release must begin with a one- or two-sentence summary of its main user outcome.
- `Action required`, when present, must be the first section after the summary.
- `Known limitations`, when present, must be the last section.
- `Known limitations` may include only limitations introduced by or especially relevant to that release. Do not repeat an unchanged backlog across releases.
- Include only sections that contain entries. Do not add empty sections.
- Prefer stable product-domain headings such as `Markdown preview`, `Themes and appearance`, `Mermaid`, `Accessibility`, and `Installation and compatibility`.
- A release may introduce another plain-language product-domain heading when it is clearer for users.
- Prefer the relevant product domain for fixes. Use `Fixes` only for a short set of unrelated corrections that would otherwise create several one-item sections.
- Section headings must be plain English and must not depend on emoji or internal change-type labels such as `Refactor`, `Maintenance`, or `Dependencies`.
- Order sections and entries by user impact, with the most important first.
- The summary must synthesize the release outcome rather than repeat detailed entries verbatim.

## Writing an Entry

Each bullet must:

- Lead with the behavior or outcome someone can observe
- Name the affected feature, setting, content type, or condition
- State any required action directly
- Stand on its own without relying on its heading for essential meaning
- Use present tense, active voice, plain English, and established product terminology
- Keep to one idea and normally no more than two sentences
- End with a period

Use `you` when it makes an available action or required migration clearer. Avoid `we`, contributor-oriented narration, commit-message prefixes, filenames, source symbols, and tool names unless someone using the extension must know them.

Use exact command, extension, and setting identifiers in backticks. Describe verified behavior precisely; do not use claims such as “identical to GitHub” when the change only improves parity in specific cases.

The canonical changelog is written in English. Translated release communication may be published separately, but it must preserve the same user impact and required actions.

### Before and After

| Avoid                                          | Write instead                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Refactor Mermaid synchronization state.        | Turning off Mermaid theme synchronization now restores your previous Mermaid light and dark theme settings. |
| Update `markdown-it` and regenerate snapshots. | Omit it, unless the update changes behavior someone can observe.                                            |
| Fix footnote bug.                              | Consecutive footnote definitions now keep the same numbering and spacing as GitHub.                         |
| Add link underline configuration.              | You can now show GitHub-style underlines on links to make them easier to identify.                          |
| Add visual regression tests for alerts.        | Omit it.                                                                                                    |

## Actions, Compatibility, and Security

An entry under `Action required` must state:

1. Who is affected and under what condition
2. What behavior or interface changed
3. The exact action needed to continue using the feature

### Breaking Changes

A change is breaking when an existing supported setting, command, workflow, compatibility target, or documented behavior no longer works without user action.

Every breaking change must:

- Ship in a SemVer-major release
- Appear under `Action required` before all product-domain sections
- Begin with `**Breaking:**`
- Identify who is affected, what stops working, and the exact migration action
- Link to a migration guide when the required procedure is too long for one or two sentences

The release summary must warn that the update requires action. For example:

```markdown
### Action required

- **Breaking:** If your settings use `<old-setting>`, replace it with `<new-setting>` before updating. The old setting is no longer read.
```

For deprecations, state the replacement and the planned removal version only when that plan is committed. For compatibility changes, name the affected VS Code or companion-extension versions.

For security changes, explain the user impact and required update without publishing details that are still embargoed. Link to the public advisory when one exists.

## Links and Release Notes

- Put optional issue or pull request links at the end of an entry; the user-facing statement must remain understandable without opening them.
- Use inline links inside a release section. The release-note extractor does not include reference definitions stored at the bottom of `CHANGELOG.md`.
- Do not use a ticket number, commit hash, or pull request title as the entry text.
- Keep detailed migration procedures in a dedicated guide and link to it from `Action required`.

## Workflow

1. Add an eligible change under `[Unreleased]` in the same pull request that changes user-observable behavior.
2. Before release, review `[Unreleased]` as a whole: remove internal noise, merge related entries, use consistent terminology, and order by impact.
3. Promote the content into a dated `## [vVERSION] - YYYY-MM-DD` section, add its summary, and create a new empty `[Unreleased]` section.
4. Update the comparison links at the bottom of `CHANGELOG.md`.
5. Generate the release notes and confirm the extracted section is complete and understandable on its own.

Automation may draft or validate entries, but a person must curate the final wording and decide what is notable.

## Review Checklist

Before merging or publishing, confirm:

- Every entry describes something observable or actionable for someone using the extension.
- The summary explains the release outcome without duplicating the entries.
- Required actions and compatibility changes are prominent and exact.
- Every breaking change is prominent, actionable, and reflected in the major version.
- Internal implementation and maintenance details are absent.
- Product names, commands, settings, and supported versions match the current codebase.
- Related entries are merged and ordered by user impact.
- Every link works when the version section is rendered as GitHub Release notes.
- The release-note extraction test and relevant formatting checks pass.

Changes to this standard should include a rationale and an example showing how the change improves communication for extension users.
