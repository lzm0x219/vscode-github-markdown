import { readFile } from "node:fs/promises";
import { writeTextIfChanged } from "../shared/files";
import { project } from "../shared/project";
import { extractRelease } from "./changelog";

const workspace = process.env["GITHUB_WORKSPACE"];
if (!workspace) {
  throw new Error("Cannot write release notes: GITHUB_WORKSPACE is not set");
}

const changelog = await readFile(project.paths.changelog, "utf8");
const packageJson = JSON.parse(await readFile(project.paths.packageJson, "utf8")) as {
  version?: unknown;
};
if (typeof packageJson.version !== "string") {
  throw new Error("Cannot write release notes: package.json version is missing");
}

const releaseNotes = extractRelease(changelog, packageJson.version);
await writeTextIfChanged(`${workspace}-CHANGELOG.txt`, `${releaseNotes}\n`);
