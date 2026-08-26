import { describe, expect, it } from "vitest";
import {
  GithubCssSnapshotContractError,
  type GithubCssSnapshot,
  type GithubCssSnapshotAsset
} from "../../../scripts/build/github-css";
import {
  classifyProbeError,
  createDriftReport,
  maximumSuccessfulProbeAgeHours,
  renderDriftReport
} from "../../../scripts/drift/probe";

const asset: GithubCssSnapshotAsset = {
  url: "https://github.githubassets.com/assets/primer-123abc.css",
  sha256: "a".repeat(64),
  cache: { freshness: "cached", ageSeconds: 3_600 },
  signals: { mediaRules: 1, dataSelectors: ["data-theme"], classSelectors: ["markdown-body"] }
};

const snapshot: GithubCssSnapshot = {
  schemaVersion: 1,
  capturedAt: "2026-07-26T00:00:00.000Z",
  extractor: {
    package: "generate-github-markdown-css",
    version: "1.0.0",
    entryPage: "https://github.com/example"
  },
  fixtureCommit: "b".repeat(40),
  themes: ["light", "dark"],
  assets: [asset],
  filtering: {
    input: asset.signals,
    output: asset.signals,
    excluded: { mediaRules: 0, dataSelectors: 0, classSelectors: 0 }
  }
};

describe("upstream drift probe", () => {
  it("treats the 30-hour freshness boundary as fresh and missing history as missing", async () => {
    const boundary = await createDriftReport({
      now: new Date("2026-07-26T12:00:00.000Z"),
      lastSuccessAt: "2026-07-25T06:00:00.000Z",
      captureSnapshot: async () => snapshot,
      verifyRemoteParity: async () => {}
    });
    const missing = await createDriftReport({
      now: new Date("2026-07-26T12:00:00.000Z"),
      captureSnapshot: async () => snapshot,
      verifyRemoteParity: async () => {}
    });

    expect(boundary.successfulProbeFreshness).toMatchObject({
      status: "fresh",
      thresholdHours: maximumSuccessfulProbeAgeHours,
      ageHours: 30
    });
    expect(missing.successfulProbeFreshness).toEqual({
      status: "missing",
      thresholdHours: maximumSuccessfulProbeAgeHours
    });
  });

  it("reports successful comparison with cache and stale-result freshness", async () => {
    const report = await createDriftReport({
      now: new Date("2026-07-26T12:00:00.000Z"),
      lastSuccessAt: "2026-07-25T05:00:00.000Z",
      captureSnapshot: async () => snapshot,
      verifyRemoteParity: async () => {}
    });

    expect(report.conclusion).toBe("success");
    expect(report.successfulProbeFreshness).toMatchObject({
      status: "stale",
      thresholdHours: maximumSuccessfulProbeAgeHours,
      ageHours: 31
    });
    expect(report.cache).toEqual({
      fresh: 0,
      cached: 1,
      unknown: 0,
      maximumAgeSeconds: 3_600
    });
    expect(renderDriftReport(report)).toContain("Successful result freshness: `stale`");
  });

  it("preserves contract assets when extraction fails", async () => {
    const report = await createDriftReport({
      now: new Date("2026-07-26T12:00:00.000Z"),
      captureSnapshot: async () => {
        throw new GithubCssSnapshotContractError([asset]);
      },
      verifyRemoteParity: async () => {}
    });

    expect(report.conclusion).toBe("extraction_failure");
    expect(report.failure).toMatchObject({
      stage: "extract",
      name: "GithubCssSnapshotContractError",
      assets: [asset]
    });
    expect(report.cache.cached).toBe(1);
  });

  it.each([
    ["Visual parity exceeded its limits", "drift_detected"],
    ["GitHub Markdown API returned 503", "github_api_unavailable"],
    ["fetch failed: ENOTFOUND api.github.com", "network_failure"],
    ["Playwright browser failed to capture screenshot", "render_failure"],
    ["Unexpected runner state", "infrastructure_failure"]
  ] as const)("classifies %s as %s", (message, conclusion) => {
    expect(classifyProbeError("compare", new Error(message))).toBe(conclusion);
  });

  it("preserves three-way drift and stage conclusions", () => {
    const upstream = Object.assign(new Error("Three-way report failed"), {
      report: { conclusion: "upstream-drift-with-user-impact" }
    });
    const extraction = Object.assign(new Error("Three-way report failed"), {
      report: { conclusion: "extract-failure" }
    });

    expect(classifyProbeError("compare", upstream)).toBe("drift_detected");
    expect(classifyProbeError("compare", extraction)).toBe("extraction_failure");
  });
});
