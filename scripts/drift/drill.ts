import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { GithubCssSnapshot } from "../build/github-css";
import type { VisualBaseline } from "../parity/baseline";
import { parityCases } from "../parity/cases";
import {
  collectThreeWayReport,
  renderThreeWayReport,
  ThreeWayParityReportError,
  type ThreeWayDependencies,
  type ThreeWayReport
} from "../parity/three-way";
import { createDriftReport } from "./probe";

export const simulatedDriftSloSeconds = 30 * 60 * 60;

export type SimulatedDriftDrillReport = {
  schemaVersion: 1;
  scenario: "upstream-drift-with-user-impact";
  startedAt: string;
  detectedAt: string;
  classifiedAt: string;
  alertedAt: string;
  recoveredAt: string;
  detectionLatencySeconds: number;
  recoveryLatencySeconds: number;
  sloSeconds: number;
  withinSlo: boolean;
  threeWayConclusion: "upstream-drift-with-user-impact";
  detectionConclusion: "drift_detected";
  recoveryConclusion: "success";
  recoveryAction: "rollback-simulated-upstream-change";
  evidence: readonly string[];
};

const snapshot: GithubCssSnapshot = {
  schemaVersion: 1,
  capturedAt: "2026-07-26T00:00:00.000Z",
  extractor: {
    package: "generate-github-markdown-css",
    version: "simulated",
    entryPage: "https://github.com/simulated"
  },
  fixtureCommit: "d".repeat(40),
  themes: ["light", "dark"],
  assets: [
    {
      url: "https://github.githubassets.com/assets/simulated-drift.css",
      sha256: "e".repeat(64),
      cache: { freshness: "fresh", ageSeconds: 0 },
      signals: {
        mediaRules: 1,
        dataSelectors: ["data-theme"],
        classSelectors: ["markdown-body"]
      }
    }
  ],
  filtering: {
    input: {
      mediaRules: 1,
      dataSelectors: ["data-theme"],
      classSelectors: ["markdown-body"]
    },
    output: {
      mediaRules: 1,
      dataSelectors: ["data-theme"],
      classSelectors: ["markdown-body"]
    },
    excluded: { mediaRules: 0, dataSelectors: 0, classSelectors: 0 }
  }
};

export async function createSimulatedDriftDrill(
  startedAt = new Date(),
  writeArtifact: ThreeWayDependencies["writeArtifact"] = async () => {}
): Promise<SimulatedDriftDrillReport> {
  return (await executeSimulatedDriftDrill(startedAt, writeArtifact)).report;
}

async function executeSimulatedDriftDrill(
  startedAt: Date,
  writeArtifact: ThreeWayDependencies["writeArtifact"]
): Promise<{ report: SimulatedDriftDrillReport; threeWay: ThreeWayReport }> {
  const detectedAt = new Date(startedAt.getTime() + 2_000);
  const classifiedAt = new Date(startedAt.getTime() + 3_000);
  const alertedAt = new Date(startedAt.getTime() + 4_000);
  const recoveredAt = new Date(startedAt.getTime() + 8_000);
  const threeWay = await createSimulatedThreeWayReport(writeArtifact);
  if (threeWay.conclusion !== "upstream-drift-with-user-impact") {
    throw new Error(`Simulated three-way report concluded ${threeWay.conclusion}`);
  }
  const driftError = new ThreeWayParityReportError(threeWay, "artifacts/drift-drill");
  const detected = await createDriftReport({
    now: detectedAt,
    captureSnapshot: async () => snapshot,
    verifyRemoteParity: async () => {
      throw driftError;
    }
  });
  const recovered = await createDriftReport({
    now: recoveredAt,
    captureSnapshot: async () => snapshot,
    verifyRemoteParity: async () => {}
  });
  if (detected.conclusion !== "drift_detected" || recovered.conclusion !== "success") {
    throw new Error(
      "Simulated drift drill did not reach the expected detection and recovery states"
    );
  }
  const detectionLatencySeconds = (detectedAt.getTime() - startedAt.getTime()) / 1_000;
  const recoveryLatencySeconds = (recoveredAt.getTime() - startedAt.getTime()) / 1_000;
  return {
    threeWay,
    report: {
      schemaVersion: 1,
      scenario: "upstream-drift-with-user-impact",
      startedAt: startedAt.toISOString(),
      detectedAt: detectedAt.toISOString(),
      classifiedAt: classifiedAt.toISOString(),
      alertedAt: alertedAt.toISOString(),
      recoveredAt: recoveredAt.toISOString(),
      detectionLatencySeconds,
      recoveryLatencySeconds,
      sloSeconds: simulatedDriftSloSeconds,
      withinSlo: detectionLatencySeconds <= simulatedDriftSloSeconds,
      threeWayConclusion: threeWay.conclusion,
      detectionConclusion: detected.conclusion,
      recoveryConclusion: recovered.conclusion,
      recoveryAction: "rollback-simulated-upstream-change",
      evidence: [
        "Generated three-way report conclusion upstream-drift-with-user-impact",
        "Drift probe classified the injected result as drift_detected",
        "Emitted a simulated upstream drift workflow warning",
        "Rolled back the simulated upstream change",
        "Post-rollback drift probe concluded success"
      ]
    }
  };
}

export function renderSimulatedDriftDrill(report: SimulatedDriftDrillReport): string {
  return `${[
    "# Simulated upstream drift recovery drill",
    "",
    `- Scenario: \`${report.scenario}\``,
    `- Three-way report: \`${report.threeWayConclusion}\``,
    `- Detection: \`${report.detectionConclusion}\` after ${report.detectionLatencySeconds}s`,
    `- SLO: ${report.sloSeconds}s (${report.withinSlo ? "met" : "missed"})`,
    `- Recovery: \`${report.recoveryConclusion}\` after ${report.recoveryLatencySeconds}s`,
    `- Action: \`${report.recoveryAction}\``,
    "",
    "## Evidence",
    "",
    ...report.evidence.map((item) => `- ${item}`),
    ""
  ].join("\n")}\n`;
}

export async function writeSimulatedDriftDrill(
  outputDirectory: string,
  startedAt = new Date()
): Promise<SimulatedDriftDrillReport> {
  await mkdir(outputDirectory, { recursive: true });
  const { report, threeWay } = await executeSimulatedDriftDrill(startedAt, (name, content) =>
    writeFile(join(outputDirectory, name), content)
  );
  await Promise.all([
    writeFile(join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`),
    writeFile(join(outputDirectory, "report.md"), renderSimulatedDriftDrill(report)),
    writeFile(
      join(outputDirectory, "three-way-report.json"),
      `${JSON.stringify(threeWay, null, 2)}\n`
    ),
    writeFile(join(outputDirectory, "three-way-report.md"), renderThreeWayReport(threeWay))
  ]);
  return report;
}

async function createSimulatedThreeWayReport(
  writeArtifact: ThreeWayDependencies["writeArtifact"]
): Promise<ThreeWayReport> {
  const selected = parityCases.filter(({ id }) => id === "stress-light" || id === "stress-dark");
  const baseline: VisualBaseline = {
    version: 2,
    generatedAt: "2026-07-26T00:00:00.000Z",
    chromiumVersion: "simulated",
    rendererSha256: "a".repeat(64),
    referenceCssSha256: "b".repeat(64),
    cases: Object.fromEntries(
      selected.map((parityCase) => [
        parityCase.id,
        {
          markdownSha256: "a".repeat(64),
          inputSha256: "b".repeat(64),
          theme: parityCase.theme,
          themeName: parityCase.themeName,
          linkUnderlines: parityCase.linkUnderlines,
          reference: parityCase.reference,
          htmlNormalization: parityCase.htmlNormalization,
          localComparison: parityCase.localComparison,
          githubHtml: `<p>${parityCase.id} baseline</p>`
        }
      ])
    )
  };
  return collectThreeWayReport(selected, {
    fetchCurrentGithub: async () =>
      Object.fromEntries(selected.map(({ id }) => [id, `<p>${id} current GitHub</p>`])),
    extractInputs: async () => ({
      baseline,
      committedReferenceCss: "baseline css",
      currentGithubCss: "current GitHub css",
      currentExtensionCss: "baseline css"
    }),
    render: async (requests) => ({
      chromiumVersion: "simulated",
      screenshots: Object.fromEntries(
        requests.map(({ id }) => [
          id,
          Buffer.from(id.endsWith("current-github") ? "current-github" : "baseline")
        ])
      )
    }),
    compare: (expected, actual) => {
      const diffPixels = expected.equals(actual) ? 0 : 1;
      return {
        width: 1,
        height: 1,
        diffPixels,
        diffPixelRatio: diffPixels,
        largestDiffAreaPixels: diffPixels,
        diff: Buffer.from(`diff:${diffPixels}`)
      };
    },
    writeArtifact
  });
}
