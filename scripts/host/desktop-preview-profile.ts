import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { posix, win32 } from "node:path";

const maximumMacOsIpcSocketPathBytes = 103;
const macOsIpcSocketName = "1.12-main.sock";

interface DesktopPreviewEnvironment {
  canonicalTemporaryDirectory: string;
  platform: NodeJS.Platform;
  userIdentity: string;
}

export function resolveDesktopPreviewDirectories(
  temporaryDirectory: string,
  version: string,
  projectRoot: string,
  environment: DesktopPreviewEnvironment = desktopPreviewEnvironment(temporaryDirectory)
): { extensionsDir: string; userDataDir: string } {
  const path = environment.platform === "win32" ? win32 : posix;
  const dataDir = path.join(temporaryDirectory, "vsgm-host-preview", version);
  const projectId = stableId(projectRoot);
  const userDataDir = path.join(dataDir, projectId);
  return {
    extensionsDir: path.join(dataDir, "extensions"),
    userDataDir:
      environment.platform === "win32" || fitsMacOsIpcSocket(userDataDir)
        ? userDataDir
        : path.join(
            environment.canonicalTemporaryDirectory,
            `vsgm-${stableId(`${environment.userIdentity}\0${temporaryDirectory}`)}`,
            stableId(version),
            projectId
          )
  };
}

function stableId(value: string): string {
  return createHash("sha256").update(value).digest("base64url").slice(0, 12);
}

function fitsMacOsIpcSocket(userDataDir: string): boolean {
  return (
    Buffer.byteLength(posix.join(userDataDir, macOsIpcSocketName)) <= maximumMacOsIpcSocketPathBytes
  );
}

function desktopPreviewEnvironment(temporaryDirectory: string): DesktopPreviewEnvironment {
  return {
    canonicalTemporaryDirectory: shortTemporaryDirectory(temporaryDirectory, process.platform),
    platform: process.platform,
    userIdentity: typeof process.getuid === "function" ? String(process.getuid()) : "unknown"
  };
}

function shortTemporaryDirectory(temporaryDirectory: string, platform: NodeJS.Platform): string {
  const path = platform === "win32" ? win32 : posix;
  const rootTemporaryDirectory = path.join(path.parse(temporaryDirectory).root, "tmp");
  try {
    return realpathSync.native(rootTemporaryDirectory);
  } catch {
    return rootTemporaryDirectory;
  }
}
