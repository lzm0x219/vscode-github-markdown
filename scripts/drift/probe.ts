import {
  GithubCssSnapshotContractError,
  type GithubCssSnapshot,
  type GithubCssSnapshotAsset
} from "../build/github-css";

export const maximumSuccessfulProbeAgeHours = 30;

export type DriftConclusion =
  | "success"
  | "drift_detected"
  | "github_api_unavailable"
  | "network_failure"
  | "extraction_failure"
  | "render_failure"
  | "infrastructure_failure";

export type ProbeStage = "extract" | "compare";

export type DriftReport = {
  schemaVersion: 1;
  generatedAt: string;
  conclusion: DriftConclusion;
  runUrl?: string;
  successfulProbeFreshness: {
    status: "fresh" | "stale" | "missing";
    thresholdHours: number;
    lastSuccessAt?: string;
    ageHours?: number;
  };
  cache: {
    fresh: number;
    cached: number;
    unknown: number;
    maximumAgeSeconds?: number;
  };
  cssSnapshot?: GithubCssSnapshot;
  failure?: {
    stage: ProbeStage;
    name: string;
    message: string;
    assets?: readonly GithubCssSnapshotAsset[];
  };
};

type DriftProbeOptions = {
  now: Date;
  lastSuccessAt?: string;
  runUrl?: string;
  captureSnapshot: () => Promise<GithubCssSnapshot>;
  verifyRemoteParity: () => Promise<void>;
};

export async function createDriftReport(options: DriftProbeOptions): Promise<DriftReport> {
  const base = {
    schemaVersion: 1 as const,
    generatedAt: options.now.toISOString(),
    ...(options.runUrl ? { runUrl: options.runUrl } : {}),
    successfulProbeFreshness: successfulProbeFreshness(options.now, options.lastSuccessAt)
  };

  let cssSnapshot: GithubCssSnapshot;
  try {
    cssSnapshot = await options.captureSnapshot();
  } catch (error) {
    const assets = error instanceof GithubCssSnapshotContractError ? error.assets : undefined;
    return {
      ...base,
      conclusion: classifyProbeError("extract", error),
      cache: summarizeCache(assets ?? []),
      failure: failureDetails("extract", error, assets)
    };
  }

  try {
    await options.verifyRemoteParity();
  } catch (error) {
    return {
      ...base,
      conclusion: classifyProbeError("compare", error),
      cache: summarizeCache(cssSnapshot.assets),
      cssSnapshot,
      failure: failureDetails("compare", error)
    };
  }

  return {
    ...base,
    conclusion: "success",
    cache: summarizeCache(cssSnapshot.assets),
    cssSnapshot
  };
}

export function classifyProbeError(stage: ProbeStage, error: unknown): DriftConclusion {
  if (error instanceof GithubCssSnapshotContractError) return "extraction_failure";
  const threeWayConclusion = threeWayReportConclusion(error);
  if (
    threeWayConclusion === "upstream-drift" ||
    threeWayConclusion === "upstream-drift-with-user-impact"
  ) {
    return "drift_detected";
  }
  if (threeWayConclusion === "extract-failure") return "extraction_failure";
  if (threeWayConclusion === "render-failure") return "render_failure";
  const message = errorMessage(error);
  if (/fetch failed|timed out|econn|enotfound|eai_again|aborterror/i.test(message)) {
    return "network_failure";
  }
  if (
    /GitHub (?:Markdown|Contents|Commits) API|secondary rate limit|GitHub response exceeds|HTTP \d{3}/i.test(
      message
    )
  ) {
    return "github_api_unavailable";
  }
  if (/Visual parity exceeded its limits/i.test(message)) return "drift_detected";
  if (/playwright|chromium|browser|screenshot/i.test(message)) return "render_failure";
  if (/CSS|extract|asset-name|generated GitHub/i.test(message)) return "extraction_failure";
  return stage === "extract" ? "extraction_failure" : "infrastructure_failure";
}

export function renderDriftReport(report: DriftReport): string {
  const freshness = report.successfulProbeFreshness;
  const lines = [
    "# GitHub upstream drift probe",
    "",
    `- Conclusion: \`${report.conclusion}\``,
    `- Generated: ${report.generatedAt}`,
    `- Successful result freshness: \`${freshness.status}\``,
    ...(freshness.lastSuccessAt ? [`- Last successful result: ${freshness.lastSuccessAt}`] : []),
    ...(freshness.ageHours === undefined
      ? []
      : [`- Last successful result age: ${freshness.ageHours.toFixed(2)} hours`]),
    `- Cache: ${report.cache.fresh} fresh, ${report.cache.cached} cached, ${report.cache.unknown} unknown`,
    ...(report.cache.maximumAgeSeconds === undefined
      ? []
      : [`- Oldest cache entry: ${report.cache.maximumAgeSeconds} seconds`]),
    ...(report.runUrl ? [`- Workflow run: ${report.runUrl}`] : [])
  ];
  if (report.failure) {
    lines.push(
      "",
      "## Failure",
      "",
      `- Stage: \`${report.failure.stage}\``,
      `- Type: \`${report.failure.name}\``,
      "",
      "```text",
      report.failure.message.slice(0, 4_000),
      "```"
    );
  }
  return `${lines.join("\n")}\n`;
}

function successfulProbeFreshness(
  now: Date,
  lastSuccessAt: string | undefined
): DriftReport["successfulProbeFreshness"] {
  if (!lastSuccessAt) {
    return { status: "missing", thresholdHours: maximumSuccessfulProbeAgeHours };
  }
  const timestamp = Date.parse(lastSuccessAt);
  if (!Number.isFinite(timestamp)) {
    return { status: "missing", thresholdHours: maximumSuccessfulProbeAgeHours };
  }
  const ageHours = Math.max(0, (now.getTime() - timestamp) / 3_600_000);
  return {
    status: ageHours > maximumSuccessfulProbeAgeHours ? "stale" : "fresh",
    thresholdHours: maximumSuccessfulProbeAgeHours,
    lastSuccessAt: new Date(timestamp).toISOString(),
    ageHours
  };
}

function summarizeCache(assets: readonly GithubCssSnapshotAsset[]): DriftReport["cache"] {
  const result: DriftReport["cache"] = { fresh: 0, cached: 0, unknown: 0 };
  const ages: number[] = [];
  for (const { cache } of assets) {
    result[cache.freshness] += 1;
    if (cache.ageSeconds !== undefined) ages.push(cache.ageSeconds);
  }
  if (ages.length > 0) result.maximumAgeSeconds = Math.max(...ages);
  return result;
}

function failureDetails(
  stage: ProbeStage,
  error: unknown,
  assets?: readonly GithubCssSnapshotAsset[]
): NonNullable<DriftReport["failure"]> {
  return {
    stage,
    name: error instanceof Error ? error.name : "UnknownError",
    message: errorMessage(error),
    ...(assets ? { assets } : {})
  };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function threeWayReportConclusion(error: unknown): string | undefined {
  if (
    typeof error !== "object" ||
    error === null ||
    !("report" in error) ||
    typeof error.report !== "object" ||
    error.report === null ||
    !("conclusion" in error.report) ||
    typeof error.report.conclusion !== "string"
  ) {
    return undefined;
  }
  return error.report.conclusion;
}
