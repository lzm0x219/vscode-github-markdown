import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { hostVersions } from "../../../scripts/host/versions";

describe("hostVersions", () => {
  it("keeps the rolling desktop smoke channel separate from the pinned preview baseline", () => {
    expect(hostVersions.latestStableDesktop).toBe("stable");
    expect(hostVersions.pinnedPreview).toEqual({
      desktopVersion: "1.129.0",
      markdownItVersion: "14.2.0",
      markdownItTypesVersion: "14.1.2",
      webCommit: "125df4672b8a6a34975303c6b0baa124e560a4f7"
    });
  });

  it("matches the MarkdownIt dependency to the pinned VS Code preview host", () => {
    const manifest = JSON.parse(
      readFileSync(new URL("../../../package.json", import.meta.url), "utf8")
    ) as { devDependencies?: Record<string, string> };

    expect(manifest.devDependencies?.["markdown-it"]).toBe(
      hostVersions.pinnedPreview.markdownItVersion
    );
    expect(manifest.devDependencies?.["@types/markdown-it"]).toBe(
      hostVersions.pinnedPreview.markdownItTypesVersion
    );
  });

  it("keeps the pinned desktop version in one source of truth", () => {
    const workflow = readFileSync(
      new URL("../../../.github/workflows/ci.yml", import.meta.url),
      "utf8"
    );

    expect(workflow).not.toContain(`vscode: ${hostVersions.pinnedPreview.desktopVersion}`);
  });

  it("keeps Renovate from changing dependencies supplied by the pinned preview host", () => {
    const renovate = JSON.parse(
      readFileSync(new URL("../../../.github/renovate.json", import.meta.url), "utf8")
    ) as {
      packageRules?: Array<{
        description?: string;
        enabled?: boolean;
        matchManagers?: string[];
        matchPackageNames?: string[];
      }>;
    };

    expect(renovate.packageRules).toContainEqual({
      description: "Update MarkdownIt only with the pinned VS Code preview host",
      enabled: false,
      matchManagers: ["npm"],
      matchPackageNames: ["markdown-it", "@types/markdown-it"]
    });
  });
});
