import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { join, parse } from "node:path";

const maximumMacOsIpcSocketPathBytes = 103;
const macOsIpcSocketName = "1.12-main.sock";

export function resolveDesktopPreviewDirectories(
  temporaryDirectory: string,
  version: string,
  projectRoot: string
): { extensionsDir: string; userDataDir: string } {
  const dataDir = join(temporaryDirectory, "vsgm-host-preview", version);
  const projectId = stableId(projectRoot);
  const userDataDir = join(dataDir, projectId);
  return {
    extensionsDir: join(dataDir, "extensions"),
    userDataDir:
      process.platform === "win32" || fitsMacOsIpcSocket(userDataDir)
        ? userDataDir
        : join(shortTemporaryDirectory(temporaryDirectory), "vsgm", stableId(version), projectId)
  };
}

function stableId(value: string): string {
  return createHash("sha256").update(value).digest("base64url").slice(0, 12);
}

function fitsMacOsIpcSocket(userDataDir: string): boolean {
  return Buffer.byteLength(join(userDataDir, macOsIpcSocketName)) <= maximumMacOsIpcSocketPathBytes;
}

function shortTemporaryDirectory(temporaryDirectory: string): string {
  const rootTemporaryDirectory = join(parse(temporaryDirectory).root, "tmp");
  try {
    return realpathSync.native(rootTemporaryDirectory);
  } catch {
    return rootTemporaryDirectory;
  }
}
