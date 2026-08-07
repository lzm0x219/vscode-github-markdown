import { basename, posix, win32 } from "node:path";
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
      "/worktrees/first/project",
      {
        canonicalTemporaryDirectory: "/private/tmp",
        platform: "darwin",
        userIdentity: "501"
      }
    );

    expect(Buffer.byteLength(`${userDataDir}/1.12-main.sock`)).toBeLessThanOrEqual(103);
  });

  it("keeps the macOS IPC socket within its byte budget for a long temporary directory", () => {
    const longTemporaryDirectory = "/Users/example/a-very-long-workspace-specific-temp-directory";
    const { userDataDir } = resolveDesktopPreviewDirectories(
      longTemporaryDirectory,
      "1.129.0",
      "/worktrees/first/project",
      {
        canonicalTemporaryDirectory: "/private/tmp",
        platform: "darwin",
        userIdentity: "501"
      }
    );

    expect(Buffer.byteLength(`${userDataDir}/1.12-main.sock`)).toBeLessThanOrEqual(103);
  });

  it("isolates fallback profiles between operating-system users", () => {
    const longTemporaryDirectory = "/Users/example/a-very-long-workspace-specific-temp-directory";
    const canonicalTemporaryDirectory = "/private/tmp";
    const firstUser = resolveDesktopPreviewDirectories(
      longTemporaryDirectory,
      "1.129.0",
      "/worktrees/first/project",
      { canonicalTemporaryDirectory, platform: "darwin", userIdentity: "501" }
    );
    const firstUserAgain = resolveDesktopPreviewDirectories(
      longTemporaryDirectory,
      "1.129.0",
      "/worktrees/first/project",
      { canonicalTemporaryDirectory, platform: "darwin", userIdentity: "501" }
    );
    const secondUser = resolveDesktopPreviewDirectories(
      longTemporaryDirectory,
      "1.129.0",
      "/worktrees/first/project",
      { canonicalTemporaryDirectory, platform: "darwin", userIdentity: "502" }
    );

    const firstNamespace = posix
      .relative(canonicalTemporaryDirectory, firstUser.userDataDir)
      .split(posix.sep)[0];
    const secondNamespace = posix
      .relative(canonicalTemporaryDirectory, secondUser.userDataDir)
      .split(posix.sep)[0];
    expect(firstNamespace).toMatch(/^vsgm-[0-9A-Za-z_-]+$/);
    expect(firstNamespace).not.toBe(secondNamespace);
    expect(firstUser).toEqual(firstUserAgain);
    expect(firstUser.extensionsDir).toBe(secondUser.extensionsDir);
  });

  it("applies the short IPC profile only on POSIX platforms", () => {
    const version = "1.129.0";
    const projectRoot = "/worktrees/first/project";
    const longPosixTemporaryDirectory =
      "/Users/example/a-very-long-workspace-specific-temp-directory";
    const darwin = resolveDesktopPreviewDirectories(
      longPosixTemporaryDirectory,
      version,
      projectRoot,
      {
        canonicalTemporaryDirectory: "/private/tmp",
        platform: "darwin",
        userIdentity: "501"
      }
    );
    const linux = resolveDesktopPreviewDirectories(
      longPosixTemporaryDirectory,
      version,
      projectRoot,
      {
        canonicalTemporaryDirectory: "/private/tmp",
        platform: "linux",
        userIdentity: "501"
      }
    );

    const longWindowsTemporaryDirectory = String.raw`C:\Users\example\a-very-long-workspace-specific-temp-directory`;
    const windows = resolveDesktopPreviewDirectories(
      longWindowsTemporaryDirectory,
      version,
      String.raw`C:\worktrees\first\project`,
      {
        canonicalTemporaryDirectory: String.raw`C:\Windows\Temp`,
        platform: "win32",
        userIdentity: "501"
      }
    );

    expect(Buffer.byteLength(posix.join(darwin.userDataDir, "1.12-main.sock"))).toBeLessThanOrEqual(
      103
    );
    expect(darwin.userDataDir).toMatch(/^\/private\/tmp\/vsgm-[0-9A-Za-z_-]+\//);
    expect(linux).toEqual(darwin);
    expect(win32.dirname(windows.userDataDir)).toBe(
      win32.join(longWindowsTemporaryDirectory, "vsgm-host-preview", version)
    );
    expect(windows.extensionsDir).toBe(
      win32.join(longWindowsTemporaryDirectory, "vsgm-host-preview", version, "extensions")
    );
  });
});
