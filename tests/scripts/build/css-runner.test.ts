import { describe, expect, it, vi } from "vitest";
import { createCssBuildRunner } from "../../../scripts/build/css-runner";

describe("createCssBuildRunner", () => {
  it("retries a full build until one succeeds", async () => {
    const buildAll = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("theme generation failed"))
      .mockResolvedValue("full");
    const buildPreview = vi.fn<() => Promise<string>>().mockResolvedValue("preview");
    const runner = createCssBuildRunner({ buildAll, buildPreview });

    await expect(runner.buildAll()).rejects.toThrow("theme generation failed");
    await expect(runner.rebuild()).resolves.toBe("full");

    expect(buildAll).toHaveBeenCalledTimes(2);
    expect(buildPreview).not.toHaveBeenCalled();
  });

  it("uses lightweight preview builds after a full build succeeds", async () => {
    const buildAll = vi.fn<() => Promise<string>>().mockResolvedValue("full");
    const buildPreview = vi.fn<() => Promise<string>>().mockResolvedValue("preview");
    const runner = createCssBuildRunner({ buildAll, buildPreview });

    await expect(runner.buildAll()).resolves.toBe("full");
    await expect(runner.rebuild()).resolves.toBe("preview");

    expect(buildAll).toHaveBeenCalledTimes(1);
    expect(buildPreview).toHaveBeenCalledTimes(1);
  });
});
