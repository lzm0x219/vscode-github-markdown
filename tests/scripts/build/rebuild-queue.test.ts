import { describe, expect, it } from "vitest";
import { createRebuildQueue } from "../../../scripts/build/rebuild-queue";

describe("createRebuildQueue", () => {
  it("runs one build at a time and coalesces changes during a build", async () => {
    let releaseBuild: (() => void) | undefined;
    let builds = 0;
    const queue = createRebuildQueue(async () => {
      builds += 1;
      await new Promise<void>((resolve) => {
        releaseBuild = resolve;
      });
    });

    queue.request();
    queue.request();
    queue.request();
    await Promise.resolve();
    expect(builds).toBe(1);

    releaseBuild?.();
    await Promise.resolve();
    await Promise.resolve();
    expect(builds).toBe(2);

    releaseBuild?.();
    await queue.idle();
  });

  it("reports errors and remains usable", async () => {
    const errors: unknown[] = [];
    let builds = 0;
    const queue = createRebuildQueue(
      async () => {
        builds += 1;
        if (builds === 1) throw new Error("broken CSS");
      },
      (error) => errors.push(error)
    );

    queue.request();
    await queue.idle();
    queue.request();
    await queue.idle();

    expect(errors).toHaveLength(1);
    expect(builds).toBe(2);
  });
});
