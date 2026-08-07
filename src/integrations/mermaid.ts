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

type MermaidThemeTarget = vscode.ConfigurationTarget.Global | vscode.ConfigurationTarget.Workspace;

type MermaidThemeSnapshot = {
  light: MermaidTheme | undefined;
  dark: MermaidTheme | undefined;
  targets?: {
    light: MermaidThemeTarget;
    dark: MermaidThemeTarget;
  };
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
    updateMermaidTheme(
      configuration,
      originSection.light,
      light,
      snapshot.targets?.light ?? vscode.ConfigurationTarget.Global
    ),
    updateMermaidTheme(
      configuration,
      originSection.dark,
      dark,
      snapshot.targets?.dark ?? vscode.ConfigurationTarget.Global
    )
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
  const lightTarget = snapshot.targets?.light ?? vscode.ConfigurationTarget.Global;
  if (
    snapshot.applied?.light !== undefined &&
    getMermaidThemeAtTarget(configuration, originSection.light, lightTarget) ===
      snapshot.applied.light
  ) {
    updates.push(
      updateMermaidTheme(configuration, originSection.light, snapshot.light, lightTarget)
    );
  }
  const darkTarget = snapshot.targets?.dark ?? vscode.ConfigurationTarget.Global;
  if (
    snapshot.applied?.dark !== undefined &&
    getMermaidThemeAtTarget(configuration, originSection.dark, darkTarget) === snapshot.applied.dark
  ) {
    updates.push(updateMermaidTheme(configuration, originSection.dark, snapshot.dark, darkTarget));
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

  const light = getEffectiveMermaidThemeOverride(configuration, originSection.light);
  const dark = getEffectiveMermaidThemeOverride(configuration, originSection.dark);
  const newSnapshot = {
    light: light.value,
    dark: dark.value,
    targets: {
      light: light.target,
      dark: dark.target
    }
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

function getMermaidThemeAtTarget(
  configuration: vscode.WorkspaceConfiguration,
  key: typeof originSection.light | typeof originSection.dark,
  target: MermaidThemeTarget
): MermaidTheme | undefined {
  const inspected = configuration.inspect<MermaidTheme>(key);
  return target === vscode.ConfigurationTarget.Workspace
    ? inspected?.workspaceValue
    : inspected?.globalValue;
}

function getEffectiveMermaidThemeOverride(
  configuration: vscode.WorkspaceConfiguration,
  key: typeof originSection.light | typeof originSection.dark
): { value: MermaidTheme | undefined; target: MermaidThemeTarget } {
  const inspected = configuration.inspect<MermaidTheme>(key);
  if (inspected?.workspaceValue !== undefined) {
    return {
      value: inspected.workspaceValue,
      target: vscode.ConfigurationTarget.Workspace
    };
  }
  return {
    value: inspected?.globalValue,
    target: vscode.ConfigurationTarget.Global
  };
}

async function updateMermaidTheme(
  configuration: vscode.WorkspaceConfiguration,
  key: typeof originSection.light | typeof originSection.dark,
  theme: MermaidTheme | undefined,
  target: MermaidThemeTarget = vscode.ConfigurationTarget.Global
): Promise<void> {
  await configuration.update(key, theme, target);
}
