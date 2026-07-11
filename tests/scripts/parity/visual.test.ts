import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { compareScreenshots } from "../../../scripts/parity/visual";

describe("compareScreenshots", () => {
  it("reports identical screenshots as a perfect match", () => {
    const screenshot = createScreenshot([255, 255, 255, 255]);

    const result = compareScreenshots(screenshot, screenshot);

    expect(result.diffPixels).toBe(0);
    expect(result.diffPixelRatio).toBe(0);
    expect(PNG.sync.read(result.diff).width).toBe(1);
  });

  it("counts visually different pixels and produces a diff image", () => {
    const expected = createScreenshot([255, 255, 255, 255, 255, 255, 255, 255], 2);
    const actual = createScreenshot([255, 255, 255, 255, 0, 0, 0, 255], 2);

    const result = compareScreenshots(expected, actual);

    expect(result.diffPixels).toBe(1);
    expect(result.diffPixelRatio).toBe(0.5);
    expect(result.largestDiffAreaPixels).toBe(1);
    expect(PNG.sync.read(result.diff).data).not.toEqual(PNG.sync.read(expected).data);
  });

  it("counts a one-channel-value difference as a strict pixel difference", () => {
    const expected = createScreenshot([255, 255, 255, 255]);
    const actual = createScreenshot([254, 255, 255, 255]);

    expect(compareScreenshots(expected, actual).diffPixels).toBe(1);
  });

  it("counts pixels that exist in only one screenshot when dimensions differ", () => {
    const onePixel = createScreenshot([255, 255, 255, 255]);
    const twoPixels = createScreenshot([255, 255, 255, 255, 255, 255, 255, 255], 2);

    const result = compareScreenshots(onePixel, twoPixels);

    expect(result.width).toBe(2);
    expect(result.height).toBe(1);
    expect(result.diffPixels).toBe(1);
    expect(result.largestDiffAreaPixels).toBe(1);
  });

  it("does not count canvas cells absent from both differently shaped screenshots", () => {
    const horizontal = createScreenshot([255, 255, 255, 255, 255, 255, 255, 255], 2);
    const vertical = createScreenshot([255, 255, 255, 255, 255, 255, 255, 255], 1, 2);

    const result = compareScreenshots(horizontal, vertical);

    expect(result.width).toBe(2);
    expect(result.height).toBe(2);
    expect(result.diffPixels).toBe(2);
    expect(result.largestDiffAreaPixels).toBe(1);
  });

  it("reports the largest connected difference area", () => {
    const expected = createScreenshot(
      Array.from({ length: 16 }, () => 255),
      4
    );
    const actual = createScreenshot(
      [0, 0, 0, 255, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255],
      4
    );

    const result = compareScreenshots(expected, actual);

    expect(result.diffPixels).toBe(3);
    expect(result.largestDiffAreaPixels).toBe(2);
  });
});

function createScreenshot(data: number[], width = 1, height = 1): Buffer {
  const png = new PNG({ width, height });
  png.data = Buffer.from(data);
  return PNG.sync.write(png);
}
