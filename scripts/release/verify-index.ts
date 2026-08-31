import { readFile } from "node:fs/promises";
import { project } from "../shared/project";
import { extractRelease } from "./changelog";

const [manifestSource, changelog] = await Promise.all([
  readFile(project.paths.packageJson, "utf8"),
  readFile(project.paths.changelog, "utf8")
]);
const manifest = JSON.parse(manifestSource) as { version?: unknown };
if (typeof manifest.version !== "string") {
  throw new Error("Cannot verify release notes: package.json version is missing");
}

extractRelease(changelog, manifest.version);
console.log(`Release changelog contains v${manifest.version}`);
