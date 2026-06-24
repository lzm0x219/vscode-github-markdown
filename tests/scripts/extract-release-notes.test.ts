import { describe, expect, it } from "vitest";
import { extractReleaseNotes } from "../../scripts/extract-release-notes";

describe("extractReleaseNotes", () => {
  it("renames the latest changelog title to What's Changed", () => {
    const changelog = `# Changelog

## [v2.0.0] - 2026-06-24

- New behavior.

## [v1.0.0]

- Old behavior.

[v2.0.0]: https://example.com/compare/v1...v2
`;

    expect(extractReleaseNotes(changelog)).toBe("## What's Changed\n\n- New behavior.");
  });
});
