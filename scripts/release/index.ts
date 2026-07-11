import { readFile } from "node:fs/promises";
import { writeTextIfChanged } from "../shared/files";
import { project } from "../shared/project";
import { extractLatestRelease } from "./changelog";

const workspace = process.env["GITHUB_WORKSPACE"];
if (!workspace) {
  throw new Error("Cannot write release notes: GITHUB_WORKSPACE is not set");
}

const changelog = await readFile(project.paths.changelog, "utf8");
const releaseNotes = extractLatestRelease(changelog);
await writeTextIfChanged(`${workspace}-CHANGELOG.txt`, `${releaseNotes}\n`);
