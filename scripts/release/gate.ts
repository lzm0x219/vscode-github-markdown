import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type ManualReleaseOverride =
  | { enabled: false }
  | { enabled: true; reason: string; owner: string; reportUrl: string };

export type ReleaseGateAudit = {
  schemaVersion: 1;
  generatedAt: string;
  ref: string;
  sha: string;
  actor: string;
  runUrl: string;
  override: ManualReleaseOverride;
  parity?: {
    outcome: string;
    decision: "pass" | "audited-override" | "blocked";
  };
};

type ReleaseGateEnvironment = Record<string, string | undefined>;

export function resolveManualReleaseOverride(
  reasonInput: string | undefined,
  ownerInput: string | undefined,
  reportUrlInput: string | undefined
): ManualReleaseOverride {
  const reason = reasonInput?.trim() ?? "";
  const owner = ownerInput?.trim() ?? "";
  const reportUrl = reportUrlInput?.trim() ?? "";
  const supplied = [reason, owner, reportUrl].filter(Boolean).length;
  if (supplied === 0) return { enabled: false };
  if (supplied !== 3) {
    throw new Error(
      "A release gate override requires override_reason, override_owner, and override_report_url"
    );
  }
  if (reason.length < 10) {
    throw new Error("A release gate override reason must contain at least 10 characters");
  }
  let url: URL;
  try {
    url = new URL(reportUrl);
  } catch {
    throw new Error("A release gate override report must be a valid HTTPS URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("A release gate override report must be a valid HTTPS URL");
  }
  return { enabled: true, reason, owner, reportUrl: url.toString() };
}

export function createReleaseGateAudit(
  environment: ReleaseGateEnvironment,
  now = new Date()
): ReleaseGateAudit {
  const repository = required(environment, "GITHUB_REPOSITORY");
  const serverUrl = required(environment, "GITHUB_SERVER_URL");
  const runId = required(environment, "GITHUB_RUN_ID");
  return {
    schemaVersion: 1,
    generatedAt: now.toISOString(),
    ref: required(environment, "GITHUB_REF_NAME"),
    sha: required(environment, "GITHUB_SHA"),
    actor: required(environment, "GITHUB_ACTOR"),
    runUrl: `${serverUrl}/${repository}/actions/runs/${runId}`,
    override: resolveManualReleaseOverride(
      environment["RELEASE_GATE_OVERRIDE_REASON"],
      environment["RELEASE_GATE_OVERRIDE_OWNER"],
      environment["RELEASE_GATE_OVERRIDE_REPORT_URL"]
    )
  };
}

export function evaluateReleaseGate(
  parityOutcome: string,
  override: ManualReleaseOverride
): NonNullable<ReleaseGateAudit["parity"]> {
  if (parityOutcome === "success") return { outcome: parityOutcome, decision: "pass" };
  if (override.enabled) return { outcome: parityOutcome, decision: "audited-override" };
  return { outcome: parityOutcome, decision: "blocked" };
}

export async function runReleaseGateCommand(
  command: string,
  environment: ReleaseGateEnvironment = process.env
): Promise<void> {
  const directory = join(process.cwd(), "artifacts", "release-gate");
  const auditPath = join(directory, "audit.json");
  await mkdir(directory, { recursive: true });
  if (command === "prepare") {
    const audit = createReleaseGateAudit(environment);
    await writeFile(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
    const output = environment["GITHUB_OUTPUT"];
    if (output) {
      await appendFile(output, `override_enabled=${String(audit.override.enabled)}\n`);
    }
    console.log(`Release gate audit prepared for ${audit.ref} at ${audit.sha}`);
    return;
  }
  if (command === "enforce") {
    const audit = JSON.parse(await readFile(auditPath, "utf8")) as ReleaseGateAudit;
    audit.parity = evaluateReleaseGate(
      environment["RELEASE_GATE_PARITY_OUTCOME"] ?? "unknown",
      audit.override
    );
    await writeFile(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
    if (audit.parity.decision === "blocked") {
      throw new Error(
        `Fresh upstream parity concluded ${audit.parity.outcome}; an audited override was not supplied`
      );
    }
    if (audit.parity.decision === "audited-override") {
      console.warn(
        `Release gate overridden by ${audit.override.enabled ? audit.override.owner : "unknown"}; see ${audit.runUrl}`
      );
    }
    console.log(`Release gate decision: ${audit.parity.decision}`);
    return;
  }
  throw new Error(`Unknown release gate command: ${command}. Expected prepare or enforce.`);
}

function required(environment: ReleaseGateEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`Missing required release gate environment variable ${name}`);
  return value;
}
