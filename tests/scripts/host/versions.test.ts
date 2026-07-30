import { describe, expect, it } from "vitest";
import { hostVersions } from "../../../scripts/host/versions";

describe("hostVersions", () => {
  it("keeps the rolling desktop smoke channel separate from the pinned preview baseline", () => {
    expect(hostVersions.latestStableDesktop).toBe("stable");
    expect(hostVersions.pinnedPreview).toEqual({
      desktopVersion: "1.129.0",
      webCommit: "125df4672b8a6a34975303c6b0baa124e560a4f7"
    });
  });
});
