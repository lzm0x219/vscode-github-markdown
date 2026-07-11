import { describe, expect, it } from "vitest";
import { extractLatestRelease } from "../../../scripts/release/changelog";

describe("extractLatestRelease", () => {
  it.each([
    [
      "another release",
      "# Changelog\n\n## [v2.0.0] - 2026-06-24\n\n- New.\n\n## [v1.0.0]\n\n- Old.\n",
      "## What's Changed\n\n- New."
    ],
    [
      "link definitions",
      "# Changelog\n\n## [v2.0.0]\n\n- New.\n\n[v2.0.0]: https://example.com/v2\n",
      "## What's Changed\n\n- New."
    ],
    ["end of file", "# Changelog\n\n## [v2.0.0]\n\n- New.\n", "## What's Changed\n\n- New."]
  ])("extracts a release followed by %s", (_case, changelog, expected) => {
    expect(extractLatestRelease(changelog)).toBe(expected);
  });

  it("preserves Markdown inside the latest section", () => {
    const changelog = "## [v1.0.0]\n\n### Added\n\n- **GitHub** [alerts](https://example.com).\n";
    expect(extractLatestRelease(changelog)).toBe(
      "## What's Changed\n\n### Added\n\n- **GitHub** [alerts](https://example.com)."
    );
  });

  it.each(["", "# Changelog\n\nNo releases yet.\n", "## Unreleased\n\n- Work in progress.\n"])(
    "rejects a changelog without a version section",
    (changelog) => {
      expect(() => extractLatestRelease(changelog)).toThrow(
        "Cannot extract release notes: no version section was found"
      );
    }
  );
});
