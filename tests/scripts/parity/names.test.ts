import { describe, expect, it } from "vitest";
import { artifactNames, screenshotKeys } from "../../../scripts/parity/names";

describe("visual parity names", () => {
  it("keeps baseline and current GitHub screenshots distinct", () => {
    expect(screenshotKeys("formatting-light")).toEqual({
      reference: "formatting-light-reference",
      current: "formatting-light-current"
    });
    expect(artifactNames("formatting-light", "github")).toEqual({
      expected: "formatting-light-github.png",
      actual: "formatting-light-current-github.png",
      diff: "formatting-light-diff.png"
    });
  });
});
