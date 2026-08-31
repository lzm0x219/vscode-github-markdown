import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  new URL("../../../.github/workflows/host-canary.yml", import.meta.url),
  "utf8"
);

describe("VS Code host canary", () => {
  it("runs the existing desktop host seam against Insiders on a schedule", () => {
    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).toContain("VSCODE_TEST_VERSION: insiders");
    expect(workflow).toContain("xvfb-run -a nub run test:host:desktop");
  });

  it("reports a deduplicated issue before preserving the failed conclusion", () => {
    expect(workflow).toContain("continue-on-error: true");
    expect(workflow).toContain("[Host canary] VS Code Insiders compatibility changed");
    expect(workflow).toContain("gh issue comment");
    expect(workflow).toContain("gh issue create");
    expect(workflow).toContain("steps.smoke.outcome == 'failure'");
    expect(workflow).toContain("run: exit 1");
  });
});
