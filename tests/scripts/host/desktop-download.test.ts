import { describe, expect, it, vi } from "vitest";
import {
  downloadDesktopVSCode,
  type DesktopVSCodeDownloader
} from "../../../scripts/host/desktop-download";

describe("downloadDesktopVSCode", () => {
  it("retries the download without retrying the host test", async () => {
    const downloader = vi
      .fn<DesktopVSCodeDownloader>()
      .mockRejectedValueOnce(Object.assign(new Error("timed out"), { code: "ETIMEDOUT" }))
      .mockRejectedValueOnce(Object.assign(new Error("reset"), { code: "ECONNRESET" }))
      .mockResolvedValue("/tmp/vscode");
    const wait = vi.fn<(milliseconds: number) => Promise<void>>(async () => undefined);

    await expect(
      downloadDesktopVSCode("1.129.0", {
        downloader,
        retryDelayMilliseconds: 100,
        wait
      })
    ).resolves.toBe("/tmp/vscode");

    expect(downloader).toHaveBeenCalledTimes(3);
    expect(downloader).toHaveBeenNthCalledWith(1, {
      timeout: 60_000,
      version: "1.129.0"
    });
    expect(wait).toHaveBeenNthCalledWith(1, 100);
    expect(wait).toHaveBeenNthCalledWith(2, 200);
  });
});
