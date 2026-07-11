import { describe, expect, it } from "vitest";
import { extractRelease } from "../../../scripts/release/changelog";

describe("extractRelease", () => {
  it.each([
    [
      "another release",
      "# Changelog\n\n## [Unreleased]\n\n- Next.\n\n## [v2.0.0] - 2026-06-24\n\n- New.\n\n## [v1.0.0]\n\n- Old.\n",
      "## What's Changed\n\n- New."
    ],
    [
      "link definitions",
      "# Changelog\n\n## [v2.0.0]\n\n- New.\n\n[v2.0.0]: https://example.com/v2\n",
      "## What's Changed\n\n- New."
    ],
    [
      "heading without a v prefix",
      "# Changelog\n\n## [2.0.0]\n\n- New.\n",
      "## What's Changed\n\n- New."
    ]
  ])("extracts a release followed by %s", (_case, changelog, expected) => {
    expect(extractRelease(changelog, "2.0.0")).toBe(expected);
  });

  it("preserves Markdown inside the latest section", () => {
    const changelog = "## [v1.0.0]\n\n### Added\n\n- **GitHub** [alerts](https://example.com).\n";
    expect(extractRelease(changelog, "1.0.0")).toBe(
      "## What's Changed\n\n### Added\n\n- **GitHub** [alerts](https://example.com)."
    );
  });

  it.each(["", "# Changelog\n\nNo releases yet.\n", "## [Unreleased]\n\n- Work in progress.\n"])(
    "rejects a changelog without the requested version",
    (changelog) => {
      expect(() => extractRelease(changelog, "2.0.0")).toThrow(
        "Cannot extract release notes: version 2.0.0 was not found"
      );
    }
  );
});
