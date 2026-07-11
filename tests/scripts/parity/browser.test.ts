import { describe, expect, it } from "vitest";
import { deterministicImageFixture } from "../../../scripts/parity/browser";

describe("visual parity image fixtures", () => {
  it("preserves dimensions from canonical fixture URLs", () => {
    expect(deterministicImageFixture("https://placehold.co/600x400/example")).toContain(
      'width="600" height="400"'
    );
  });

  it("decodes GitHub camo URLs before selecting dimensions", () => {
    const canonical = "https://placehold.co/800x400/example";
    const camo = `https://camo.githubusercontent.com/hash/${Buffer.from(canonical).toString("hex")}`;
    expect(deterministicImageFixture(camo)).toContain('width="800" height="400"');
  });

  it("uses a stable intrinsic size when a URL has no dimensions", () => {
    expect(deterministicImageFixture("https://example.com/image.png")).toContain(
      'width="1" height="1"'
    );
  });

  it("bounds untrusted intrinsic dimensions", () => {
    expect(deterministicImageFixture("https://example.com/999999x999999/image.png")).toContain(
      'width="4096" height="4096"'
    );
  });

  it("keeps extreme aspect-ratio dimensions non-zero", () => {
    expect(deterministicImageFixture("https://example.com/999999x1/image.png")).toContain(
      'width="4096" height="1"'
    );
    expect(deterministicImageFixture("https://example.com/1x999999/image.png")).toContain(
      'width="1" height="4096"'
    );
  });
});
