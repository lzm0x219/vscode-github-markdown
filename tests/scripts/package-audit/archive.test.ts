import { describe, expect, it } from "vitest";
import { parseZipListing } from "../../../scripts/package-audit/archive";

describe("parseZipListing", () => {
  it("creates a package snapshot from an unzip listing", () => {
    const snapshot = parseZipListing(
      `Archive:  current.vsix
  Length      Date    Time    Name
---------  ---------- -----   ----
   105000  07-26-2026 07:00   extension/dist/extension.js
    10000  07-26-2026 07:00   extension/readme.md
---------                     -------
   115000                     2 files
`,
      42_000
    );

    expect(snapshot).toEqual({
      archiveBytes: 42_000,
      entries: {
        "extension/dist/extension.js": 105_000,
        "extension/readme.md": 10_000
      }
    });
  });
});
