import { downloadAndUnzipVSCode, type DownloadOptions } from "@vscode/test-electron";

export type DesktopVSCodeDownloader = (options: Partial<DownloadOptions>) => Promise<string>;

interface DesktopVSCodeDownloadDependencies {
  downloader?: DesktopVSCodeDownloader;
  retryDelayMilliseconds?: number;
  wait?: (milliseconds: number) => Promise<void>;
}

const attempts = 3;
const timeout = 60_000;

export async function downloadDesktopVSCode(
  version: DownloadOptions["version"],
  dependencies: DesktopVSCodeDownloadDependencies = {}
): Promise<string> {
  const downloader = dependencies.downloader ?? downloadAndUnzipVSCode;
  const retryDelayMilliseconds = dependencies.retryDelayMilliseconds ?? 1_000;
  const wait = dependencies.wait ?? delay;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await downloader({ timeout, version });
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }

      await wait(retryDelayMilliseconds * 2 ** (attempt - 1));
    }
  }

  throw new Error("VS Code download retry loop exited unexpectedly");
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
