import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeReleaseNotes } from "../../../scripts/release/notes";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("release notes output", () => {
  it("writes notes from explicit package and changelog inputs", async () => {
    const workspace = await createReleaseFixture(
      "2.0.0",
      "# Changelog\n\n## [v2.0.0] - 2026-07-15\n\nRelease summary.\n"
    );

    await writeReleaseNotes(releaseNotesInput(workspace));

    await expect(readFile(join(workspace, "release-CHANGELOG.txt"), "utf8")).resolves.toBe(
      "## What's Changed\n\nRelease summary.\n"
    );
  });

  it("rejects a release whose changelog has no matching version", async () => {
    const workspace = await createReleaseFixture(
      "3.0.0",
      "# Changelog\n\n## [v2.0.0] - 2026-07-15\n\nPrevious release.\n"
    );

    await expect(writeReleaseNotes(releaseNotesInput(workspace))).rejects.toThrow(
      "Cannot extract release notes: version 3.0.0 was not found"
    );
    await expect(readFile(join(workspace, "release-CHANGELOG.txt"), "utf8")).rejects.toMatchObject({
      code: "ENOENT"
    });
  });
});

function releaseNotesInput(workspace: string) {
  return {
    workspace,
    packageJsonPath: join(workspace, "package.json"),
    changelogPath: join(workspace, "CHANGELOG.md")
  };
}

async function createReleaseFixture(version: string, changelog: string): Promise<string> {
  const workspace = await mkdtemp(join(tmpdir(), "vscode-github-markdown-release-"));
  temporaryDirectories.push(workspace);
  await Promise.all([
    writeFile(join(workspace, "package.json"), JSON.stringify({ version }), "utf8"),
    writeFile(join(workspace, "CHANGELOG.md"), changelog, "utf8")
  ]);
  return workspace;
}
