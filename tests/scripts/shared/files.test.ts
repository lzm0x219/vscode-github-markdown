import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeTextIfChanged } from "../../../scripts/shared/files";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

describe("writeTextIfChanged", () => {
  it("creates missing parent directories and files", async () => {
    const directory = await createTemporaryDirectory();
    const file = join(directory, "nested", "output.txt");

    await expect(writeTextIfChanged(file, "first\n")).resolves.toBe("created");
    await expect(readFile(file, "utf8")).resolves.toBe("first\n");
  });

  it("does not replace a file whose content is unchanged", async () => {
    const directory = await createTemporaryDirectory();
    const file = join(directory, "output.txt");
    await writeTextIfChanged(file, "same\n");
    const modifiedAt = (await stat(file)).mtimeMs;

    await expect(writeTextIfChanged(file, "same\n")).resolves.toBe("unchanged");
    expect((await stat(file)).mtimeMs).toBe(modifiedAt);
  });

  it("atomically replaces changed content", async () => {
    const directory = await createTemporaryDirectory();
    const file = join(directory, "output.txt");
    await writeTextIfChanged(file, "before\n");

    await expect(writeTextIfChanged(file, "after\n")).resolves.toBe("updated");
    await expect(readFile(file, "utf8")).resolves.toBe("after\n");
  });
});

async function createTemporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "vscode-github-markdown-"));
  temporaryDirectories.push(directory);
  return directory;
}
