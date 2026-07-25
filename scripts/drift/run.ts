import { execFile } from "node:child_process";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { createReferenceCssSnapshot } from "../parity/browser";
import { runParityCommand } from "../parity/cli";
import { project } from "../shared/project";
import { createDriftReport, renderDriftReport } from "./probe";

export async function runDriftProbe(): Promise<void> {
  const fixtureCommit = await currentFixtureCommit();
  const report = await createDriftReport({
    now: new Date(),
    ...(process.env["DRIFT_LAST_SUCCESS_AT"]
      ? { lastSuccessAt: process.env["DRIFT_LAST_SUCCESS_AT"] }
      : {}),
    ...(process.env["DRIFT_RUN_URL"] ? { runUrl: process.env["DRIFT_RUN_URL"] } : {}),
    captureSnapshot: async () => {
      const { snapshot } = await createReferenceCssSnapshot(fixtureCommit);
      return snapshot;
    },
    verifyRemoteParity: () => runParityCommand("remote")
  });
  const directory = join(project.root, "artifacts", "drift");
  const markdown = renderDriftReport(report);
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(join(directory, "report.json"), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(join(directory, "report.md"), markdown)
  ]);

  const output = process.env["GITHUB_OUTPUT"];
  if (output) {
    await appendFile(
      output,
      `conclusion=${report.conclusion}\nfreshness=${report.successfulProbeFreshness.status}\n`
    );
  }
  const summary = process.env["GITHUB_STEP_SUMMARY"];
  if (summary) await appendFile(summary, markdown);

  console.log(
    `GitHub upstream drift probe: ${report.conclusion} (${report.successfulProbeFreshness.status})`
  );
  if (report.conclusion !== "success") process.exitCode = 1;
}

async function currentFixtureCommit(): Promise<string> {
  const fromEnvironment = process.env["GITHUB_SHA"];
  if (fromEnvironment && /^[\da-f]{40}$/i.test(fromEnvironment)) return fromEnvironment;
  const { stdout } = await promisify(execFile)("git", ["rev-parse", "HEAD"], { cwd: project.root });
  const commit = stdout.trim();
  if (!/^[\da-f]{40}$/i.test(commit)) throw new Error("Unable to resolve drift fixture revision");
  return commit;
}
