import type { Frame, Locator, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { assertFinalClientRendering } from "../../../scripts/host/client-rendering";

describe("assertFinalClientRendering", () => {
  it("reacquires the preview when its frame reloads during the final assertions", async () => {
    const detachedFrame = createPreviewFrame({ detachDuringAssertion: true });
    const replacementFrame = createPreviewFrame();
    let frameReads = 0;
    const page = {
      frames() {
        frameReads += 1;
        return frameReads === 1 ? [detachedFrame] : [replacementFrame];
      },
      waitForTimeout: async () => {}
    } as unknown as Page;

    await expect(assertFinalClientRendering(page, 1_000)).resolves.toBeUndefined();
    expect(frameReads).toBe(2);
  });
});

function createPreviewFrame({
  detachDuringAssertion = false
}: { detachDuringAssertion?: boolean } = {}): Frame {
  return {
    locator(selector: string) {
      return {
        count: async () => 1,
        textContent: async () => {
          if (detachDuringAssertion && selector === ".mermaid svg") {
            throw new Error("Frame was detached");
          }
          if (selector === ".mermaid svg") return "Alpha Beta";
          if (selector.includes("annotation")) return "S_{12}";
          return "";
        },
        isVisible: async () => true,
        boundingBox: async () => ({ x: 0, y: 0, width: 100, height: 100 })
      } as unknown as Locator;
    },
    evaluate: async () => ({
      pageScrollable: true,
      nestedVerticalScrollerLabels: []
    }),
    url: () => "vscode-webview://preview"
  } as unknown as Frame;
}
