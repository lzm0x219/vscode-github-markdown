import { runTests } from "@vscode/test-web";
import { join } from "node:path";
import { project } from "../shared/project";
import { hostVersions } from "./versions";

await runTests({
  browserType: "chromium",
  commit: hostVersions.stable.commit,
  extensionDevelopmentPath: project.root,
  extensionTestsPath: join(project.root, ".cache", "host-tests", "smoke.js"),
  headless: true,
  quality: "stable",
  testRunnerDataDir: join(project.root, ".cache", "vscode-test-web")
});
