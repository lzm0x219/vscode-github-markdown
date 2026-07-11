import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type WriteResult = "created" | "updated" | "unchanged";

export async function writeTextIfChanged(path: string, content: string): Promise<WriteResult> {
  const current = await readTextIfPresent(path);
  if (current === content) return "unchanged";

  const parent = dirname(path);
  const temporaryPath = join(parent, `.${randomUUID()}.tmp`);
  await mkdir(parent, { recursive: true });

  try {
    await writeFile(temporaryPath, content, "utf8");
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }

  return current === undefined ? "created" : "updated";
}

async function readTextIfPresent(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}
