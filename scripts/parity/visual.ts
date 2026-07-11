import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export type ScreenshotComparison = {
  width: number;
  height: number;
  diffPixels: number;
  diffPixelRatio: number;
  largestDiffAreaPixels: number;
  diff: Buffer;
};

export function compareScreenshots(
  expectedBuffer: Buffer,
  actualBuffer: Buffer
): ScreenshotComparison {
  const expectedSource = PNG.sync.read(expectedBuffer);
  const actualSource = PNG.sync.read(actualBuffer);
  const width = Math.max(expectedSource.width, actualSource.width);
  const height = Math.max(expectedSource.height, actualSource.height);
  const expected = padScreenshot(expectedSource, width, height);
  const actual = padScreenshot(actualSource, width, height);
  const diff = new PNG({ width, height });
  const mask = new PNG({ width, height });
  const options = { threshold: 0, includeAA: true } as const;
  let diffPixels = pixelmatch(expected.data, actual.data, diff.data, width, height, options);
  pixelmatch(expected.data, actual.data, mask.data, width, height, { ...options, diffMask: true });
  diffPixels += markDimensionDifferences(expectedSource, actualSource, diff, mask, width, height);
  return {
    width,
    height,
    diffPixels,
    diffPixelRatio: diffPixels / (width * height),
    largestDiffAreaPixels: largestConnectedArea(mask),
    diff: PNG.sync.write(diff)
  };
}

function markDimensionDifferences(
  expected: PNG,
  actual: PNG,
  diff: PNG,
  mask: PNG,
  width: number,
  height: number
): number {
  let added = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const expectedHasPixel = x < expected.width && y < expected.height;
      const actualHasPixel = x < actual.width && y < actual.height;
      if (expectedHasPixel === actualHasPixel) continue;
      const offset = (y * width + x) * 4;
      if (mask.data[offset + 3] === 0) added += 1;
      mask.data.set([255, 0, 255, 255], offset);
      diff.data.set([255, 0, 255, 255], offset);
    }
  }
  return added;
}

function padScreenshot(source: PNG, width: number, height: number): PNG {
  if (source.width === width && source.height === height) return source;
  const output = new PNG({ width, height });
  const backgroundOffset = ((source.height - 1) * source.width) << 2;
  const background = source.data.subarray(backgroundOffset, backgroundOffset + 4);
  for (let offset = 0; offset < output.data.length; offset += 4) {
    output.data.set(background, offset);
  }
  PNG.bitblt(source, output, 0, 0, source.width, source.height, 0, 0);
  return output;
}

function largestConnectedArea(mask: PNG): number {
  const visited = new Uint8Array(mask.width * mask.height);
  let largest = 0;
  for (let index = 0; index < visited.length; index += 1) {
    if (visited[index] || mask.data[index * 4 + 3] === 0) continue;
    let size = 0;
    const pending = [index];
    visited[index] = 1;
    while (pending.length > 0) {
      const current = pending.pop();
      if (current === undefined) break;
      size += 1;
      const x = current % mask.width;
      const neighbors = [
        x > 0 ? current - 1 : -1,
        x + 1 < mask.width ? current + 1 : -1,
        current >= mask.width ? current - mask.width : -1,
        current + mask.width < visited.length ? current + mask.width : -1
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || visited[neighbor] || mask.data[neighbor * 4 + 3] === 0) continue;
        visited[neighbor] = 1;
        pending.push(neighbor);
      }
    }
    largest = Math.max(largest, size);
  }
  return largest;
}
