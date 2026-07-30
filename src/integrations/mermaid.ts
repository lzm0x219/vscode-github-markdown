import vscode from "vscode";
import { getConfiguration } from "../configuration";
import {
  getCurrentDarkTheme,
  getCurrentLightTheme,
  getSingleTheme,
  getThemeMode,
  isLightTheme,
  type Theme
} from "../theme";

export const originSection = {
  namespace: "markdown-mermaid",
  light: "lightModeTheme",
  dark: "darkModeTheme"
} as const;

export const section = {
  syncTheme: "mermaid.syncTheme"
} as const;

export const themes = ["vscode", "base", "forest", "dark", "default", "neutral"] as const;

export type MermaidTheme = (typeof themes)[number];

type MermaidThemeSnapshot = {
  light: MermaidTheme | undefined;
  dark: MermaidTheme | undefined;
  applied?: {
    light?: MermaidTheme;
    dark?: MermaidTheme;
  };
};

const snapshotKey = "githubMarkdown.mermaid.originalGlobalThemes";
const mermaidExtensionIds = [
  "vscode.mermaid-markdown-features",
  "bierner.markdown-mermaid"
] as const;
const MERMAID_LIGHT_THEME: MermaidTheme = "default";
const MERMAID_DARK_THEME: MermaidTheme = "dark";
let mermaidThemeOperationQueue: Promise<void> = Promise.resolve();

export function getMermaidSyncTheme(): boolean {
  return getConfiguration().get<boolean>(section.syncTheme, true);
}

export function updateMermaidThemeSync(memento: vscode.Memento): Promise<void> {
  return enqueueMermaidThemeOperation(() => updateMermaidThemeSyncNow(memento));
}

async function updateMermaidThemeSyncNow(memento: vscode.Memento): Promise<void> {
  const configuration = getOriginMermaidThemeConfiguration();

  if (!getMermaidSyncTheme()) {
    await restoreMermaidThemeSyncNow(memento, configuration);
    return;
  }

  if (!hasMermaidExtension() || !hasMermaidThemeConfiguration(configuration)) {
    return;
  }

  const snapshot = await preserveMermaidThemes(memento, configuration);
  const [light, dark] = resolveMermaidThemes();
  const [lightResult, darkResult] = await Promise.allSettled([
    updateMermaidTheme(configuration, originSection.light, light),
    updateMermaidTheme(configuration, originSection.dark, dark)
  ]);
  const applied = { ...snapshot.applied };
  if (lightResult.status === "fulfilled") {
    applied.light = light;
  }
  if (darkResult.status === "fulfilled") {
    applied.dark = dark;
  }
  await memento.update(snapshotKey, {
    ...snapshot,
    applied
  } satisfies MermaidThemeSnapshot);

  const failure = [lightResult, darkResult].find((result) => result.status === "rejected");
  if (failure?.status === "rejected") {
    try {
      await restoreMermaidThemeSyncNow(memento, configuration);
    } catch (restoreError) {
      const failureMessage =
        failure.reason instanceof Error ? failure.reason.message : String(failure.reason);
      const restoreFailures =
        restoreError instanceof AggregateError ? restoreError.errors : [restoreError];
      throw new AggregateError(
        [failure.reason, ...restoreFailures],
        `${failureMessage}; failed to restore the original Mermaid themes`
      );
    }
    throw failure.reason;
  }
}

export function restoreMermaidThemeSync(
  memento: vscode.Memento,
  configuration = getOriginMermaidThemeConfiguration()
): Promise<void> {
  return enqueueMermaidThemeOperation(() => restoreMermaidThemeSyncNow(memento, configuration));
}

async function restoreMermaidThemeSyncNow(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration
): Promise<void> {
  const snapshot = memento.get<MermaidThemeSnapshot>(snapshotKey);
  if (!snapshot || !hasMermaidThemeConfiguration(configuration)) {
    return;
  }

  const updates: Promise<void>[] = [];
  if (
    snapshot.applied?.light !== undefined &&
    getGlobalMermaidTheme(configuration, originSection.light) === snapshot.applied.light
  ) {
    updates.push(updateMermaidTheme(configuration, originSection.light, snapshot.light));
  }
  if (
    snapshot.applied?.dark !== undefined &&
    getGlobalMermaidTheme(configuration, originSection.dark) === snapshot.applied.dark
  ) {
    updates.push(updateMermaidTheme(configuration, originSection.dark, snapshot.dark));
  }

  const restoreResults = await Promise.allSettled(updates);
  const restoreFailures = restoreResults
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);
  if (restoreFailures.length > 0) {
    throw new AggregateError(restoreFailures, "Failed to restore the original Mermaid themes");
  }
  await memento.update(snapshotKey, undefined);
}

function enqueueMermaidThemeOperation(operation: () => Promise<void>): Promise<void> {
  const queuedOperation = mermaidThemeOperationQueue.then(operation);
  mermaidThemeOperationQueue = queuedOperation.catch(() => {});
  return queuedOperation;
}

function resolveMermaidThemes(): readonly [MermaidTheme, MermaidTheme] {
  const mode = getThemeMode();
  if (mode === "vscode") {
    return ["vscode", "vscode"];
  }
  if (mode === "single") {
    const theme = resolveMermaidTheme(getSingleTheme());
    return [theme, theme];
  }

  return [resolveMermaidTheme(getCurrentLightTheme()), resolveMermaidTheme(getCurrentDarkTheme())];
}

function resolveMermaidTheme(markdownTheme: Theme): MermaidTheme {
  return isLightTheme(markdownTheme) ? MERMAID_LIGHT_THEME : MERMAID_DARK_THEME;
}

async function preserveMermaidThemes(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration
): Promise<MermaidThemeSnapshot> {
  const snapshot = memento.get<MermaidThemeSnapshot>(snapshotKey);
  if (snapshot) {
    return snapshot;
  }

  const newSnapshot = {
    light: getGlobalMermaidTheme(configuration, originSection.light),
    dark: getGlobalMermaidTheme(configuration, originSection.dark)
  } satisfies MermaidThemeSnapshot;
  await memento.update(snapshotKey, newSnapshot);
  return newSnapshot;
}

function hasMermaidExtension(): boolean {
  return mermaidExtensionIds.some((id) => vscode.extensions.getExtension(id) !== undefined);
}

function getOriginMermaidThemeConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(originSection.namespace);
}

function hasMermaidThemeConfiguration(configuration: vscode.WorkspaceConfiguration): boolean {
  return (
    configuration.inspect(originSection.light) !== undefined &&
    configuration.inspect(originSection.dark) !== undefined
  );
}

function getGlobalMermaidTheme(
  configuration: vscode.WorkspaceConfiguration,
  key: typeof originSection.light | typeof originSection.dark
): MermaidTheme | undefined {
  return configuration.inspect<MermaidTheme>(key)?.globalValue;
}

async function updateMermaidTheme(
  configuration: vscode.WorkspaceConfiguration,
  key: typeof originSection.light | typeof originSection.dark,
  theme: MermaidTheme | undefined
): Promise<void> {
  await configuration.update(key, theme, vscode.ConfigurationTarget.Global);
}
