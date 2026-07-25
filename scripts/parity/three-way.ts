import type { Buffer } from "node:buffer";
import type { GithubTheme } from "../build/github-css";
import type { VisualBaseline } from "./baseline";
import type { ScreenshotRequest } from "./browser";
import type { VisualParityCase } from "./cases";
import type { ScreenshotComparison } from "./visual";
import { stripPlatformWrapperMarkup, stripSyntaxTokenMarkup } from "./html";
import { renderLocalMarkdown } from "./local";

export type ThreeWayStage = "fetch" | "extract" | "render" | "compare";
export type ThreeWayComparison =
  | "baseline-github-vs-current-github"
  | "current-extension-vs-current-github"
  | "current-extension-vs-committed-baseline";

type StageResult = {
  status: "pending" | "pass" | "fail";
  error?: { name: string; message: string };
};

type ComparisonPolicy =
  | { kind: "exact"; owner: string; limits: ComparisonLimits }
  | {
      kind: "integration-boundary";
      scope: "separate-fixture";
      owner: string;
      reason: string;
      reviewCondition: string;
      limits: ComparisonLimits;
    };

type ComparisonLimits = { pixels: number; pixelRatio: number; areaPixels: number };

export type ThreeWayCaseReport = {
  id: string;
  sourceCaseId: string;
  viewport: "wide" | "narrow";
  interaction: "default" | "focus" | "hover";
  passed: boolean;
  width: number;
  height: number;
  diffPixels: number;
  diffPixelRatio: number;
  largestDiffAreaPixels: number;
  policy: ComparisonPolicy;
  artifacts: { expected: string; actual: string; diff: string };
};

export type ThreeWayReport = {
  schemaVersion: 1;
  generatedAt: string;
  conclusion:
    | "pass"
    | "upstream-drift"
    | "upstream-drift-with-user-impact"
    | "extension-regression"
    | "multiple-differences"
    | `${ThreeWayStage}-failure`;
  stages: Record<ThreeWayStage, StageResult>;
  metadata?: {
    baselineGeneratedAt: string;
    baselineChromiumVersion: string;
    chromiumVersion: string;
  };
  comparisons: Record<ThreeWayComparison, ThreeWayCaseReport[]>;
};

export class ThreeWayParityReportError extends Error {
  constructor(
    readonly report: ThreeWayReport,
    artifactDirectory: string
  ) {
    const failedStage = (["fetch", "extract", "render", "compare"] as const).find(
      (stage) => report.stages[stage].status === "fail"
    );
    const details = failedStage
      ? `: ${report.stages[failedStage].error?.message ?? "unknown error"}`
      : "";
    super(
      `Three-way Markdown parity concluded ${report.conclusion}${details}. See ${artifactDirectory}`
    );
    this.name = "ThreeWayParityReportError";
  }
}

type ExtractedInputs = {
  baseline: VisualBaseline;
  committedReferenceCss: string;
  currentGithubCss: string;
  currentExtensionCss: string;
};

export type ThreeWayDependencies = {
  fetchCurrentGithub: () => Promise<Record<string, string>>;
  extractInputs: () => Promise<ExtractedInputs>;
  render: (
    requests: readonly ScreenshotRequest[]
  ) => Promise<{ chromiumVersion: string; screenshots: Record<string, Buffer> }>;
  compare: (expected: Buffer, actual: Buffer) => ScreenshotComparison;
  writeArtifact: (name: string, content: Buffer) => Promise<void>;
};

type ReportVariant = {
  id: string;
  source: VisualParityCase;
  viewport: "wide" | "narrow";
  dimensions: { width: number; height: number };
  interaction: "default" | "focus" | "hover";
};

const comparisons: readonly ThreeWayComparison[] = [
  "baseline-github-vs-current-github",
  "current-extension-vs-current-github",
  "current-extension-vs-committed-baseline"
];

export async function collectThreeWayReport(
  cases: readonly VisualParityCase[],
  dependencies: ThreeWayDependencies,
  generatedAt = new Date().toISOString()
): Promise<ThreeWayReport> {
  const report = emptyReport(generatedAt);
  let currentGithub: Record<string, string>;
  try {
    currentGithub = await dependencies.fetchCurrentGithub();
    report.stages.fetch = { status: "pass" };
  } catch (error) {
    return failStage(report, "fetch", error);
  }

  let inputs: ExtractedInputs;
  try {
    inputs = await dependencies.extractInputs();
    report.stages.extract = { status: "pass" };
  } catch (error) {
    return failStage(report, "extract", error);
  }

  const variants = createReportVariants(cases);
  let rendered: Awaited<ReturnType<ThreeWayDependencies["render"]>>;
  try {
    rendered = await dependencies.render(
      variants.flatMap((variant) =>
        screenshotRequests(variant, inputs, currentGithub[variant.source.id])
      )
    );
    await Promise.all(
      variants.flatMap((variant) =>
        subjects.map(async (subject) => {
          const key = screenshotKey(variant.id, subject);
          const screenshot = rendered.screenshots[key];
          if (!screenshot) throw new Error(`Missing rendered screenshot: ${key}`);
          await dependencies.writeArtifact(`${key}.png`, screenshot);
        })
      )
    );
    report.stages.render = { status: "pass" };
  } catch (error) {
    return failStage(report, "render", error);
  }

  try {
    for (const variant of variants) {
      for (const comparison of comparisons) {
        const [expectedSubject, actualSubject] = comparisonSubjects(comparison);
        const expected = rendered.screenshots[screenshotKey(variant.id, expectedSubject)];
        const actual = rendered.screenshots[screenshotKey(variant.id, actualSubject)];
        if (!expected || !actual) {
          throw new Error(`Missing screenshots for ${variant.id} ${comparison}`);
        }
        const result = dependencies.compare(expected, actual);
        const policy = comparisonPolicy(variant.source, comparison);
        const artifacts = {
          expected: `${screenshotKey(variant.id, expectedSubject)}.png`,
          actual: `${screenshotKey(variant.id, actualSubject)}.png`,
          diff: `${variant.id}-${comparison}-diff.png`
        };
        await dependencies.writeArtifact(artifacts.diff, result.diff);
        report.comparisons[comparison].push({
          id: variant.id,
          sourceCaseId: variant.source.id,
          viewport: variant.viewport,
          interaction: variant.interaction,
          passed: withinLimits(result, policy.limits),
          width: result.width,
          height: result.height,
          diffPixels: result.diffPixels,
          diffPixelRatio: result.diffPixelRatio,
          largestDiffAreaPixels: result.largestDiffAreaPixels,
          policy,
          artifacts
        });
      }
    }
    report.stages.compare = { status: "pass" };
  } catch (error) {
    return failStage(report, "compare", error);
  }

  report.metadata = {
    baselineGeneratedAt: inputs.baseline.generatedAt,
    baselineChromiumVersion: inputs.baseline.chromiumVersion,
    chromiumVersion: rendered.chromiumVersion
  };
  report.conclusion = comparisonConclusion(report.comparisons);
  return report;
}

export function renderThreeWayReport(report: ThreeWayReport): string {
  const lines = [
    "# Three-way Markdown parity",
    "",
    `Conclusion: \`${report.conclusion}\``,
    "",
    "## Stages",
    "",
    "| Stage | Status | Error |",
    "| --- | --- | --- |",
    ...(["fetch", "extract", "render", "compare"] as const).map((stage) => {
      const result = report.stages[stage];
      return `| ${stage} | ${result.status} | ${escapeTable(result.error?.message ?? "")} |`;
    })
  ];
  for (const comparison of comparisons) {
    lines.push(
      "",
      `## ${comparison}`,
      "",
      "| Case | Result | Viewport | Interaction | Pixels | Ratio | Largest area | Policy | Owner | Artifacts |",
      "| --- | --- | --- | --- | ---: | ---: | ---: | --- | --- | --- |",
      ...report.comparisons[comparison].map((item) => {
        const limits = item.policy.limits;
        const policy =
          item.policy.kind === "exact"
            ? "exact"
            : `boundary: ${item.policy.reason}; review: ${item.policy.reviewCondition}`;
        return `| ${item.id} | ${item.passed ? "Pass" : "Fail"} | ${item.viewport} | ${item.interaction} | ${item.diffPixels}/${limits.pixels} | ${(item.diffPixelRatio * 100).toFixed(4)}%/${(limits.pixelRatio * 100).toFixed(4)}% | ${item.largestDiffAreaPixels}/${limits.areaPixels} | ${escapeTable(policy)} | ${escapeTable(item.policy.owner)} | [expected](${item.artifacts.expected}) · [actual](${item.artifacts.actual}) · [diff](${item.artifacts.diff}) |`;
      })
    );
  }
  return `${lines.join("\n")}\n`;
}

export function createReportVariants(cases: readonly VisualParityCase[]): readonly ReportVariant[] {
  const byId = new Map(cases.map((parityCase) => [parityCase.id, parityCase]));
  const narrowFocus = byId.get("stress-light");
  const narrowHover = byId.get("stress-dark");
  if (!narrowFocus || !narrowHover) {
    throw new Error("Parity report matrix requires light and dark stress cases");
  }
  return [
    ...cases.map((source) => ({
      id: source.id,
      source,
      viewport: "wide" as const,
      dimensions: { width: 1024, height: 720 },
      interaction: "default" as const
    })),
    {
      id: "stress-light-narrow-focus",
      source: narrowFocus,
      viewport: "narrow",
      dimensions: { width: 420, height: 720 },
      interaction: "focus"
    },
    {
      id: "stress-dark-narrow-hover",
      source: narrowHover,
      viewport: "narrow",
      dimensions: { width: 420, height: 720 },
      interaction: "hover"
    }
  ];
}

function emptyReport(generatedAt: string): ThreeWayReport {
  return {
    schemaVersion: 1,
    generatedAt,
    conclusion: "pass",
    stages: {
      fetch: { status: "pending" },
      extract: { status: "pending" },
      render: { status: "pending" },
      compare: { status: "pending" }
    },
    comparisons: {
      "baseline-github-vs-current-github": [],
      "current-extension-vs-current-github": [],
      "current-extension-vs-committed-baseline": []
    }
  };
}

function failStage(report: ThreeWayReport, stage: ThreeWayStage, error: unknown): ThreeWayReport {
  report.stages[stage] = {
    status: "fail",
    error: {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error)
    }
  };
  report.conclusion = `${stage}-failure`;
  return report;
}

const subjects = ["baseline-github", "current-github", "current-extension"] as const;
type Subject = (typeof subjects)[number];

function screenshotRequests(
  variant: ReportVariant,
  inputs: ExtractedInputs,
  currentGithubHtml: string | undefined
): ScreenshotRequest[] {
  const baselineHtml = inputs.baseline.cases[variant.source.id]?.githubHtml;
  if (!baselineHtml) throw new Error(`Missing baseline GitHub HTML for ${variant.source.id}`);
  if (!currentGithubHtml) throw new Error(`Missing current GitHub HTML for ${variant.source.id}`);
  const common = {
    theme: variant.source.theme,
    themeName: variant.source.themeName as GithubTheme,
    linkUnderlines: variant.source.linkUnderlines,
    viewport: variant.dimensions,
    interaction: variant.interaction
  };
  return [
    {
      ...common,
      id: screenshotKey(variant.id, "baseline-github"),
      html: normalize(baselineHtml, variant.source.htmlNormalization),
      css: inputs.committedReferenceCss
    },
    {
      ...common,
      id: screenshotKey(variant.id, "current-github"),
      html: normalize(currentGithubHtml, variant.source.htmlNormalization),
      css: inputs.currentGithubCss
    },
    {
      ...common,
      id: screenshotKey(variant.id, "current-extension"),
      html: normalize(
        renderLocalMarkdown(variant.source.markdown),
        variant.source.htmlNormalization
      ),
      css: inputs.currentExtensionCss
    }
  ];
}

function normalize(html: string, mode: VisualParityCase["htmlNormalization"]): string {
  const withoutWrappers = stripPlatformWrapperMarkup(html);
  return mode === "syntax-tokens" ? stripSyntaxTokenMarkup(withoutWrappers) : withoutWrappers;
}

function screenshotKey(id: string, subject: Subject): string {
  return `${id}-${subject}`;
}

function comparisonSubjects(comparison: ThreeWayComparison): readonly [Subject, Subject] {
  if (comparison === "baseline-github-vs-current-github") {
    return ["baseline-github", "current-github"];
  }
  if (comparison === "current-extension-vs-current-github") {
    return ["current-github", "current-extension"];
  }
  return ["baseline-github", "current-extension"];
}

function comparisonPolicy(
  parityCase: VisualParityCase,
  comparison: ThreeWayComparison
): ComparisonPolicy {
  const exact = { pixels: 0, pixelRatio: 0, areaPixels: 0 };
  if (comparison === "baseline-github-vs-current-github") {
    return { kind: "exact", owner: "GitHub", limits: exact };
  }
  if (parityCase.localComparison.kind === "exact") {
    return { kind: "exact", owner: "extension", limits: exact };
  }
  const limits = {
    pixels: parityCase.maxDiffPixels,
    pixelRatio: parityCase.maxDiffPixelRatio,
    areaPixels: parityCase.maxDiffAreaPixels
  };
  if (parityCase.id.includes("host-highlighting")) {
    return {
      kind: "integration-boundary",
      scope: "separate-fixture",
      owner: "VS Code Markdown host",
      reason: parityCase.localComparison.reason,
      reviewCondition: "Review when VS Code token markup or bundled syntax highlighting changes.",
      limits
    };
  }
  return {
    kind: "integration-boundary",
    scope: "separate-fixture",
    owner: "GitHub client renderers and companion extensions",
    reason: parityCase.localComparison.reason,
    reviewCondition: "Review when Mermaid, math, GeoJSON, STL, or companion rendering changes.",
    limits
  };
}

function withinLimits(comparison: ScreenshotComparison, limits: ComparisonLimits): boolean {
  return (
    comparison.diffPixels <= limits.pixels &&
    comparison.diffPixelRatio <= limits.pixelRatio &&
    comparison.largestDiffAreaPixels <= limits.areaPixels
  );
}

function comparisonConclusion(
  results: ThreeWayReport["comparisons"]
): ThreeWayReport["conclusion"] {
  const upstream = results["baseline-github-vs-current-github"].some(({ passed }) => !passed);
  const userImpact = results["current-extension-vs-current-github"].some(({ passed }) => !passed);
  const regression = results["current-extension-vs-committed-baseline"].some(
    ({ passed }) => !passed
  );
  if (!upstream && !userImpact && !regression) return "pass";
  if (upstream && userImpact && !regression) return "upstream-drift-with-user-impact";
  if (upstream && !regression) return "upstream-drift";
  if (!upstream && regression) return "extension-regression";
  return "multiple-differences";
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}
