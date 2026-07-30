# Release gates and recovery

This runbook covers the enforced `main` and release gates, upstream provenance review, audited
overrides, recovery, and rollback.

## Main protection

The repository ruleset is versioned at `.github/rulesets/main.json`. It requires the core CI check,
the desktop minimum and current stable smoke checks, and the pinned desktop and browser preview
checks. It rejects branch deletion and non-fast-forward updates and has no bypass actors.

Inspect and apply the ruleset:

```bash
gh api repos/lzm0x219/vscode-github-markdown/rulesets
gh api --method POST repos/lzm0x219/vscode-github-markdown/rulesets \
  --input .github/rulesets/main.json
```

Update an existing ruleset by replacing `POST` with `PUT` and appending its numeric ID to the URL.
Review the live response after every change; do not assume the checked-in file was applied.

## Provenance and three-way comparison

Before refreshing any baseline, download the latest probe artifact, inspect its captured CSS
provenance, and run the independent three-way comparison:

```bash
gh run download RUN_ID \
  --name upstream-drift-RUN_ID \
  --dir artifacts/upstream-drift-RUN_ID
jq '.cssSnapshot | {capturedAt, extractor, fixtureCommit, assets}' \
  artifacts/upstream-drift-RUN_ID/drift/report.json
pnpm run verify:parity:report
jq '{conclusion, stages, metadata}' artifacts/parity/three-way-report.json
```

Interpret the three comparisons independently:

- baseline GitHub versus current GitHub identifies upstream drift;
- current extension versus current GitHub identifies user impact;
- current extension versus the committed baseline identifies local regressions.

Do not refresh when fetch, extraction, rendering, or comparison failed. Preserve
`artifacts/parity` and link the workflow run in the investigation.

## Refresh and repair

For verified upstream-only drift:

```bash
pnpm run update:parity
pnpm run verify:parity:report
git diff -- \
  tests/fixtures/parity-reference.css \
  tests/fixtures/parity-reference.snapshot.json
```

For extension regressions, fix the extension first and rerun the report without changing the
baseline. Every refresh or fix must be reviewed through a pull request with the report artifacts
available to the reviewer.

## Release

The tag workflow calls the same core and host workflow at the tag SHA, then generates a fresh
three-way report before packaging:

```bash
git tag -s vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
gh run list --workflow publish.yml --limit 1
```

A failed or stale parity result blocks release. To make an exceptional manual release, select the
exact tag as the workflow ref and provide all audit fields:

```bash
gh workflow run publish.yml --ref vX.Y.Z \
  -f override_reason="Reviewed upstream-only drift; release is time critical" \
  -f override_owner="@maintainer" \
  -f override_report_url="https://github.com/OWNER/REPO/actions/runs/RUN_ID"
```

Partial metadata, a short reason, or a non-HTTPS report URL is rejected. The workflow uploads
`artifacts/release-gate/audit.json`; include its run link in the release review.

## Simulated recovery drill

Run the deterministic detection-to-recovery drill locally or through its manual workflow:

```bash
pnpm run drill:drift
gh workflow run drift-drill.yml --ref main
```

The drill injects `upstream-drift-with-user-impact`, verifies classification as `drift_detected`,
simulates rollback, verifies a successful post-rollback probe, and records timestamps against the
30-hour detection SLO in `artifacts/drift-drill`.

## Rollback

If a tag workflow fails before publishing, fix the cause and move only the exact unpublished tag:

```bash
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```

If a GitHub Release was exposed but the Marketplace publish must be halted:

```bash
gh release edit vX.Y.Z --draft
```

Marketplace versions are not safely mutable in place. Publish a corrected patch release rather
than deleting the entire extension. Record the failed tag, workflow, cause, owner, recovery action,
and verification report in the tracking issue.
