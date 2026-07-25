import { execFile } from "node:child_process";
import { stat } from "node:fs/promises";
import { promisify } from "node:util";
import type { PackageSnapshot } from "./audit";

const execFileAsync = promisify(execFile);

export function parseZipListing(listing: string, archiveBytes: number): PackageSnapshot {
  const entries: Record<string, number> = {};
  for (const line of listing.split("\n")) {
    const match = /^\s*(\d+)\s+\S+\s+\S+\s+(.+)$/.exec(line);
    if (!match) continue;
    const [, size, path] = match;
    if (!size || !path || path.endsWith("/")) continue;
    entries[path] = Number(size);
  }
  return { archiveBytes, entries };
}

export async function readPackageSnapshot(path: string): Promise<PackageSnapshot> {
  const [{ size }, { stdout }] = await Promise.all([
    stat(path),
    execFileAsync("unzip", ["-l", path], { encoding: "utf8" })
  ]);
  return parseZipListing(stdout, size);
}
