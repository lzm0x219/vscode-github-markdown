import { describe, expect, it } from "vitest";
import {
  createReleaseGateAudit,
  evaluateReleaseGate,
  resolveManualReleaseOverride
} from "../../../scripts/release/gate";

describe("release gate", () => {
  it("requires complete audited override metadata", () => {
    expect(resolveManualReleaseOverride(undefined, undefined, undefined)).toEqual({
      enabled: false
    });
    expect(() =>
      resolveManualReleaseOverride("GitHub drift accepted", "maintainer", undefined)
    ).toThrow(/requires override_reason, override_owner, and override_report_url/);
    expect(() =>
      resolveManualReleaseOverride(
        "Reviewed upstream-only visual drift",
        "maintainer",
        "http://example.com/report"
      )
    ).toThrow(/valid HTTPS URL/);
  });

  it("records the tag SHA, actor, workflow, and override evidence", () => {
    const audit = createReleaseGateAudit(
      {
        GITHUB_REPOSITORY: "example/repository",
        GITHUB_SERVER_URL: "https://github.com",
        GITHUB_RUN_ID: "123",
        GITHUB_REF_NAME: "v4.4.0",
        GITHUB_SHA: "a".repeat(40),
        GITHUB_ACTOR: "maintainer",
        RELEASE_GATE_OVERRIDE_REASON: "Reviewed upstream-only visual drift",
        RELEASE_GATE_OVERRIDE_OWNER: "@maintainer",
        RELEASE_GATE_OVERRIDE_REPORT_URL: "https://github.com/example/repository/actions/runs/122"
      },
      new Date("2026-07-26T00:00:00.000Z")
    );

    expect(audit).toMatchObject({
      generatedAt: "2026-07-26T00:00:00.000Z",
      ref: "v4.4.0",
      sha: "a".repeat(40),
      actor: "maintainer",
      runUrl: "https://github.com/example/repository/actions/runs/123",
      override: {
        enabled: true,
        owner: "@maintainer"
      }
    });
  });

  it("blocks a failed parity result unless the override is audited", () => {
    expect(evaluateReleaseGate("success", { enabled: false }).decision).toBe("pass");
    expect(evaluateReleaseGate("failure", { enabled: false }).decision).toBe("blocked");
    expect(
      evaluateReleaseGate("failure", {
        enabled: true,
        reason: "Reviewed upstream-only visual drift",
        owner: "@maintainer",
        reportUrl: "https://example.com/report"
      }).decision
    ).toBe("audited-override");
  });
});
