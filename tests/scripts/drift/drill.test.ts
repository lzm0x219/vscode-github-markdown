import { describe, expect, it, vi } from "vitest";
import {
  createSimulatedDriftDrill,
  renderSimulatedDriftDrill,
  simulatedDriftSloSeconds
} from "../../../scripts/drift/drill";

vi.mock("vscode", () => ({ l10n: { t: (message: string) => message } }));

describe("simulated upstream drift drill", () => {
  it("detects, classifies, rolls back, and verifies recovery within the SLO", async () => {
    const report = await createSimulatedDriftDrill(new Date("2026-07-26T00:00:00.000Z"));

    expect(report).toMatchObject({
      detectionConclusion: "drift_detected",
      threeWayConclusion: "upstream-drift-with-user-impact",
      recoveryConclusion: "success",
      recoveryAction: "rollback-simulated-upstream-change",
      detectionLatencySeconds: 2,
      recoveryLatencySeconds: 8,
      sloSeconds: simulatedDriftSloSeconds,
      withinSlo: true
    });
    expect(renderSimulatedDriftDrill(report)).toContain("SLO: 108000s (met)");
  });
});
