import { project } from "../shared/project";
import { writeReleaseNotes } from "./notes";

const workspace = process.env["GITHUB_WORKSPACE"];
if (!workspace) {
  throw new Error("Cannot write release notes: GITHUB_WORKSPACE is not set");
}

await writeReleaseNotes({
  workspace,
  packageJsonPath: project.paths.packageJson,
  changelogPath: project.paths.changelog
});
