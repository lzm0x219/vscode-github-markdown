import { downloadAndUnzipVSCode } from "@vscode/test-electron";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _electron as electron } from "playwright";
import { project } from "../shared/project";
import { assertClientRenderedPreview } from "./preview";
import { hostVersions } from "./versions";

const version = process.env["VSCODE_TEST_VERSION"] ?? hostVersions.stable.version;
const fixtures = join(project.root, "tests", "fixtures", "host");
const dataDir = join(tmpdir(), "vsgm-host-preview", version);
const executablePath = await downloadAndUnzipVSCode(version);
const application = await electron.launch({
  executablePath,
  cwd: project.root,
  args: [
    fixtures,
    `--extensionDevelopmentPath=${project.root}`,
    `--user-data-dir=${join(dataDir, "user-data")}`,
    `--extensions-dir=${join(dataDir, "extensions")}`,
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
