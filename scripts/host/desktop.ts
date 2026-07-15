import { runTests } from "@vscode/test-electron";
import { join } from "node:path";
import { project } from "../shared/project";

const version = process.env["VSCODE_TEST_VERSION"] ?? "stable";

await runTests({
  version,
  extensionDevelopmentPath: project.root,
  extensionTestsPath: join(project.root, ".cache", "host-tests", "smoke.js"),
  launchArgs: ["--disable-extensions"]
});
