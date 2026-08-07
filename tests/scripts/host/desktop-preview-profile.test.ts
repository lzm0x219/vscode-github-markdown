import { basename } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDesktopPreviewDirectories } from "../../../scripts/host/desktop-preview-profile";

describe("resolveDesktopPreviewDirectories", () => {
  it("isolates user data by project root while reusing version-scoped caches", () => {
    const temporaryDirectory = "/tmp";
    const version = "1.129.0";
    const firstRoot = "/worktrees/first/project";
    const secondRoot = "/worktrees/second/project";
    const first = resolveDesktopPreviewDirectories(temporaryDirectory, version, firstRoot);
    const firstAgain = resolveDesktopPreviewDirectories(temporaryDirectory, version, firstRoot);
    const second = resolveDesktopPreviewDirectories(temporaryDirectory, version, secondRoot);

    expect(first.userDataDir).not.toBe(second.userDataDir);
    expect(first).toEqual(firstAgain);
    expect(first.extensionsDir).toBe(second.extensionsDir);
    expect(basename(first.userDataDir)).toMatch(/^[0-9A-Za-z_-]+$/);
    expect(basename(first.userDataDir)).not.toMatch(/first|project|worktrees/);
    expect(first.userDataDir).not.toContain(firstRoot);
  });

  it("keeps the VS Code IPC socket within the macOS path limit", () => {
    const macOsTemporaryDirectory = "/var/folders/jr/dv9vfr19001_lpq7pbnyls640000gn/T";
    const { userDataDir } = resolveDesktopPreviewDirectories(
      macOsTemporaryDirectory,
      "1.129.0",
      "/worktrees/first/project"
    );

    expect(Buffer.byteLength(`${userDataDir}/1.12-main.sock`)).toBeLessThanOrEqual(103);
  });

  it("keeps the macOS IPC socket within its byte budget for a long temporary directory", () => {
    const longTemporaryDirectory = "/Users/example/a-very-long-workspace-specific-temp-directory";
    const { userDataDir } = resolveDesktopPreviewDirectories(
      longTemporaryDirectory,
      "1.129.0",
      "/worktrees/first/project"
    );

    expect(Buffer.byteLength(`${userDataDir}/1.12-main.sock`)).toBeLessThanOrEqual(103);
  });
});
