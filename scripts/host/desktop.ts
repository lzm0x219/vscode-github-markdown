import { runTests } from "@vscode/test-electron";
import { join } from "node:path";
import { project } from "../shared/project";
import { downloadDesktopVSCode } from "./desktop-download";
import { hostVersions } from "./versions";

const version = process.env["VSCODE_TEST_VERSION"] ?? hostVersions.latestStableDesktop;
const vscodeExecutablePath = await downloadDesktopVSCode(version);

await runTests({
  vscodeExecutablePath,
  extensionDevelopmentPath: project.root,
  extensionTestsPath: join(project.root, ".cache", "host-tests", "smoke.js"),
  launchArgs: ["--disable-extensions"]
});
