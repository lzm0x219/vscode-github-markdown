import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("release notes output", () => {
  it("writes the generated notes inside GITHUB_WORKSPACE", async () => {
    const workspace = await mkdtemp(join(tmpdir(), "vscode-github-markdown-release-"));
    temporaryDirectories.push(workspace);
    vi.stubEnv("GITHUB_WORKSPACE", workspace);
    vi.resetModules();

    await import("../../../scripts/release/index");

    await expect(readFile(join(workspace, "release-CHANGELOG.txt"), "utf8")).resolves.toContain(
      "## What's Changed"
    );
  });
});
