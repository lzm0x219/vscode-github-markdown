import { downloadAndUnzipVSCode } from "@vscode/test-electron";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { project } from "../shared/project";
import { resolveDesktopPreviewDirectories } from "./desktop-preview-profile";
import { assertClientRenderedPreview } from "./preview";
import { hostVersions } from "./versions";

const version = process.env["VSCODE_TEST_VERSION"] ?? hostVersions.pinnedPreview.desktopVersion;
const fixtures = join(project.root, "tests", "fixtures", "host");
const directories = resolveDesktopPreviewDirectories(tmpdir(), version, project.root);
const executablePath = await downloadAndUnzipVSCode(version);
const application = await electron.launch({
  executablePath,
  cwd: project.root,
  args: [
    fixtures,
    `--extensionDevelopmentPath=${project.root}`,
    `--user-data-dir=${directories.userDataDir}`,
    `--extensions-dir=${directories.extensionsDir}`,
    "--disable-extensions",
    "--disable-workspace-trust",
    "--skip-release-notes",
    "--skip-welcome"
  ]
});

try {
  const page = await application.firstWindow({ timeout: 30_000 });
  await assertClientRenderedPreview(page);
} finally {
  await application.close();
}
