import { createHash } from "node:crypto";
import { join } from "node:path";

export function resolveDesktopPreviewDirectories(
  temporaryDirectory: string,
  version: string,
  projectRoot: string
): { extensionsDir: string; userDataDir: string } {
  const dataDir = join(temporaryDirectory, "vsgm-host-preview", version);
  const projectId = createHash("sha256").update(projectRoot).digest("base64url").slice(0, 12);
  return {
    extensionsDir: join(dataDir, "extensions"),
    userDataDir: join(dataDir, projectId)
  };
}
