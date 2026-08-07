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

type MermaidThemeSlot = "light" | "dark";

type LegacyMermaidThemeSnapshot = {
  light: MermaidTheme | undefined;
  dark: MermaidTheme | undefined;
  workspaceIdentity?: string;
  targets?: {
    light: MermaidThemeTarget;
    dark: MermaidThemeTarget;
  };
  applied?: {
    light?: MermaidTheme;
    dark?: MermaidTheme;
  };
  released?: {
    light?: true;
    dark?: true;
  };
};

type MermaidThemeSlotState = {
  version: 2;
  revision?: string;
  target: "global" | "workspace";
  workspaceIdentity?: string | undefined;
  original?: MermaidTheme | undefined;
  applied?: MermaidTheme;
  owner?: string;
  releasedBy?: string;
};

type MermaidThemeStates = {
  identity: string;
  global: Partial<Record<MermaidThemeSlot, MermaidThemeSlotState>>;
  workspace: Partial<Record<MermaidThemeSlot, MermaidThemeSlotState>>;
  dirtyGlobal: Set<MermaidThemeSlot>;
  dirtyWorkspace: Set<MermaidThemeSlot>;
  globalRevisions: Partial<Record<MermaidThemeSlot, string>>;
  workspaceRevisions: Partial<Record<MermaidThemeSlot, string>>;
};

type MermaidThemeUpdateOperation = {
  slot: MermaidThemeSlot;
  key: typeof originSection.light | typeof originSection.dark;
  target: MermaidThemeTarget;
  theme: MermaidTheme;
  state: MermaidThemeSlotState;
  previousState?: MermaidThemeSlotState | undefined;
  previousValue: MermaidTheme | undefined;
};

const snapshotKey = "githubMarkdown.mermaid.originalGlobalThemes";
const stateKeyPrefix = "githubMarkdown.mermaid.themeState.v2";
const mermaidExtensionIds = [
  "vscode.mermaid-markdown-features",
  "bierner.markdown-mermaid"
] as const;
const MERMAID_LIGHT_THEME: MermaidTheme = "default";
const MERMAID_DARK_THEME: MermaidTheme = "dark";
let mermaidThemeOperationQueue: Promise<void> = Promise.resolve();
let mermaidThemeStateRevision = 0;

export function getMermaidSyncTheme(): boolean {
  return getConfiguration().get<boolean>(section.syncTheme, true);
}

export function updateMermaidThemeSync(memento: vscode.Memento): Promise<void> {
  return enqueueMermaidThemeOperation(() => updateMermaidThemeSyncNow(memento));
}

async function updateMermaidThemeSyncNow(memento: vscode.Memento): Promise<void> {
  const configuration = getOriginMermaidThemeConfiguration();
  const states = await loadMermaidThemeStates(memento);

  if (!getMermaidSyncTheme()) {
    await restoreMermaidThemeSyncNow(memento, configuration, states);
    return;
  }

  if (!hasMermaidExtension() || !hasMermaidThemeConfiguration(configuration)) {
    return;
  }

  const [light, dark] = resolveMermaidThemes();
  const operations = prepareMermaidThemeUpdates(configuration, states, { light, dark });
  await persistMermaidThemeStates(memento, states);
  const updateResults = await Promise.allSettled(
    operations.map((operation) =>
      updateMermaidTheme(configuration, operation.key, operation.theme, operation.target)
    )
  );
  updateResults.forEach((result, index) => {
    const operation = operations[index];
    if (result.status !== "fulfilled" || !operation) {
      return;
    }
    operation.state.applied = operation.theme;
    if (operation.target === vscode.ConfigurationTarget.Global) {
      operation.state.owner = states.identity;
    }
    markMermaidThemeStateDirty(states, operation.target, operation.slot);
  });
  await persistMermaidThemeStates(memento, states);

  const failure = updateResults.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") {
    const restoreFailures = await rollbackFailedMermaidThemeSync(
      memento,
      configuration,
      states,
      operations,
      updateResults
    );
    if (restoreFailures.length > 0) {
      const failureMessage =
        failure.reason instanceof Error ? failure.reason.message : String(failure.reason);
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
  configuration: vscode.WorkspaceConfiguration,
  loadedStates?: MermaidThemeStates
): Promise<void> {
  if (!hasMermaidThemeConfiguration(configuration)) {
    return;
  }

  const states = loadedStates ?? (await loadMermaidThemeStates(memento));
  const restorations = collectMermaidThemeRestorations(states);
  const restoreResults = await Promise.allSettled(
    restorations.map(({ key, state, target }) => {
      if (
        state.applied === undefined ||
        getMermaidThemeAtTarget(configuration, key, target) !== state.applied
      ) {
        return Promise.resolve();
      }
      return updateMermaidTheme(configuration, key, state.original, target);
    })
  );
  restoreResults.forEach((result, index) => {
    const restoration = restorations[index];
    if (result.status !== "fulfilled" || !restoration) {
      return;
    }
    delete (
      restoration.target === vscode.ConfigurationTarget.Global ? states.global : states.workspace
    )[restoration.slot];
    markMermaidThemeStateDirty(states, restoration.target, restoration.slot);
  });
  await persistMermaidThemeStates(memento, states);
  const restoreFailures = restoreResults
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);
  if (restoreFailures.length > 0) {
    throw new AggregateError(restoreFailures, "Failed to restore the original Mermaid themes");
  }
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

async function loadMermaidThemeStates(memento: vscode.Memento): Promise<MermaidThemeStates> {
  const identity = getWorkspaceIdentity();
  await migrateLegacyMermaidThemeSnapshot(memento, identity);
  const global = {} as MermaidThemeStates["global"];
  const workspace = {} as MermaidThemeStates["workspace"];
  const globalRevisions = {} as MermaidThemeStates["globalRevisions"];
  const workspaceRevisions = {} as MermaidThemeStates["workspaceRevisions"];
  for (const slot of ["light", "dark"] as const) {
    const globalState = memento.get<MermaidThemeSlotState>(getGlobalThemeStateKey(slot));
    if (globalState?.version === 2 && globalState.target === "global") {
      global[slot] = { ...globalState };
      if (globalState.revision !== undefined) {
        globalRevisions[slot] = globalState.revision;
      }
    }
    const workspaceState = memento.get<MermaidThemeSlotState>(
      getWorkspaceThemeStateKey(identity, slot)
    );
    if (
      workspaceState?.version === 2 &&
      workspaceState.target === "workspace" &&
      workspaceState.workspaceIdentity === identity
    ) {
      workspace[slot] = { ...workspaceState };
      if (workspaceState.revision !== undefined) {
        workspaceRevisions[slot] = workspaceState.revision;
      }
    }
  }
  return {
    identity,
    global,
    workspace,
    dirtyGlobal: new Set(),
    dirtyWorkspace: new Set(),
    globalRevisions,
    workspaceRevisions
  };
}

async function migrateLegacyMermaidThemeSnapshot(
  memento: vscode.Memento,
  currentIdentity: string
): Promise<void> {
  const snapshot = memento.get<LegacyMermaidThemeSnapshot>(snapshotKey);
  if (!snapshot) {
    return;
  }

  for (const slot of ["light", "dark"] as const) {
    const target = snapshot.targets?.[slot] ?? vscode.ConfigurationTarget.Global;
    const identity = snapshot.workspaceIdentity;
    if (target === vscode.ConfigurationTarget.Workspace && identity === undefined) {
      continue;
    }
    const state: MermaidThemeSlotState = {
      version: 2,
      target: target === vscode.ConfigurationTarget.Workspace ? "workspace" : "global",
      original: snapshot[slot]
    };
    if (target === vscode.ConfigurationTarget.Workspace) {
      state.workspaceIdentity = identity!;
    } else if (snapshot.applied?.[slot] !== undefined) {
      state.owner = identity ?? currentIdentity;
    }
    if (snapshot.applied?.[slot] !== undefined) {
      state.applied = snapshot.applied[slot];
    }
    if (snapshot.released?.[slot]) {
      state.releasedBy = identity ?? currentIdentity;
      delete state.owner;
      delete state.applied;
    }
    const key =
      target === vscode.ConfigurationTarget.Workspace
        ? getWorkspaceThemeStateKey(identity!, slot)
        : getGlobalThemeStateKey(slot);
    if (memento.get(key) === undefined) {
      await memento.update(key, state);
    }
  }
  await memento.update(snapshotKey, undefined);
}

function prepareMermaidThemeUpdates(
  configuration: vscode.WorkspaceConfiguration,
  states: MermaidThemeStates,
  themes: Record<MermaidThemeSlot, MermaidTheme>
): MermaidThemeUpdateOperation[] {
  const operations: MermaidThemeUpdateOperation[] = [];
  for (const [slot, key] of [
    ["light", originSection.light],
    ["dark", originSection.dark]
  ] as const) {
    const effective = getEffectiveMermaidThemeOverride(configuration, key);
    const targetStates =
      effective.target === vscode.ConfigurationTarget.Global ? states.global : states.workspace;
    const dirtySlots =
      effective.target === vscode.ConfigurationTarget.Global
        ? states.dirtyGlobal
        : states.dirtyWorkspace;
    if (
      effective.target === vscode.ConfigurationTarget.Global &&
      states.workspace[slot] !== undefined
    ) {
      delete states.workspace[slot];
      states.dirtyWorkspace.add(slot);
    }

    const existingState = targetStates[slot];
    const previousState = existingState ? { ...existingState } : undefined;
    const state =
      existingState ??
      ({
        version: 2,
        target: effective.target === vscode.ConfigurationTarget.Global ? "global" : "workspace",
        original: effective.value
      } satisfies MermaidThemeSlotState);
    if (!existingState) {
      if (effective.target === vscode.ConfigurationTarget.Global) {
        state.owner = states.identity;
      } else {
        state.workspaceIdentity = states.identity;
      }
      targetStates[slot] = state;
      dirtySlots.add(slot);
    }

    if (state.releasedBy !== undefined) {
      continue;
    }
    if (
      state.applied !== undefined &&
      getMermaidThemeAtTarget(configuration, key, effective.target) !== state.applied
    ) {
      state.releasedBy = states.identity;
      delete state.applied;
      delete state.owner;
      dirtySlots.add(slot);
      continue;
    }
    operations.push({
      slot,
      key,
      target: effective.target,
      theme: themes[slot],
      state,
      previousState,
      previousValue: getMermaidThemeAtTarget(configuration, key, effective.target)
    });
  }
  return operations;
}

function collectMermaidThemeRestorations(states: MermaidThemeStates): {
  slot: MermaidThemeSlot;
  key: typeof originSection.light | typeof originSection.dark;
  target: MermaidThemeTarget;
  state: MermaidThemeSlotState;
}[] {
  const restorations: {
    slot: MermaidThemeSlot;
    key: typeof originSection.light | typeof originSection.dark;
    target: MermaidThemeTarget;
    state: MermaidThemeSlotState;
  }[] = [];
  for (const [slot, key] of [
    ["light", originSection.light],
    ["dark", originSection.dark]
  ] as const) {
    const workspaceState = states.workspace[slot];
    if (workspaceState) {
      restorations.push({
        slot,
        key,
        target: vscode.ConfigurationTarget.Workspace,
        state: workspaceState
      });
    }
    const globalState = states.global[slot];
    if (
      globalState &&
      (globalState.owner === states.identity || globalState.releasedBy === states.identity)
    ) {
      restorations.push({
        slot,
        key,
        target: vscode.ConfigurationTarget.Global,
        state: globalState
      });
    }
  }
  return restorations;
}

async function rollbackFailedMermaidThemeSync(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration,
  states: MermaidThemeStates,
  operations: MermaidThemeUpdateOperation[],
  updateResults: PromiseSettledResult<void>[]
): Promise<unknown[]> {
  const rollbacks = operations.map((operation, index) => {
    const result = updateResults[index];
    const restoresPreviousOwner =
      operation.target === vscode.ConfigurationTarget.Global &&
      operation.previousState?.owner !== undefined &&
      operation.previousState.owner !== states.identity;
    const currentValue = getMermaidThemeAtTarget(configuration, operation.key, operation.target);
    const rollback =
      currentValue === operation.state.applied &&
      ((restoresPreviousOwner && result?.status === "fulfilled") ||
        (!restoresPreviousOwner && operation.state.applied !== undefined))
        ? updateMermaidTheme(
            configuration,
            operation.key,
            restoresPreviousOwner ? operation.previousValue : operation.state.original,
            operation.target
          )
        : Promise.resolve();
    return { operation, restoresPreviousOwner, rollback };
  });
  const rollbackResults = await Promise.allSettled(rollbacks.map(({ rollback }) => rollback));
  rollbackResults.forEach((result, index) => {
    const rollback = rollbacks[index];
    if (result.status !== "fulfilled" || !rollback) {
      return;
    }
    const { operation, restoresPreviousOwner } = rollback;
    const targetStates =
      operation.target === vscode.ConfigurationTarget.Global ? states.global : states.workspace;
    if (restoresPreviousOwner && operation.previousState) {
      targetStates[operation.slot] = operation.previousState;
    } else {
      delete targetStates[operation.slot];
    }
    markMermaidThemeStateDirty(states, operation.target, operation.slot);
  });
  await persistMermaidThemeStates(memento, states);
  return rollbackResults
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);
}

function markMermaidThemeStateDirty(
  states: MermaidThemeStates,
  target: MermaidThemeTarget,
  slot: MermaidThemeSlot
): void {
  (target === vscode.ConfigurationTarget.Global ? states.dirtyGlobal : states.dirtyWorkspace).add(
    slot
  );
}

async function persistMermaidThemeStates(
  memento: vscode.Memento,
  states: MermaidThemeStates
): Promise<void> {
  for (const slot of states.dirtyGlobal) {
    const revision = await persistMermaidThemeState(
      memento,
      getGlobalThemeStateKey(slot),
      states.global[slot],
      states.globalRevisions[slot],
      states.identity
    );
    if (revision === undefined) {
      delete states.globalRevisions[slot];
    } else {
      states.globalRevisions[slot] = revision;
    }
    states.dirtyGlobal.delete(slot);
  }
  for (const slot of states.dirtyWorkspace) {
    const revision = await persistMermaidThemeState(
      memento,
      getWorkspaceThemeStateKey(states.identity, slot),
      states.workspace[slot],
      states.workspaceRevisions[slot],
      states.identity
    );
    if (revision === undefined) {
      delete states.workspaceRevisions[slot];
    } else {
      states.workspaceRevisions[slot] = revision;
    }
    states.dirtyWorkspace.delete(slot);
  }
}

async function persistMermaidThemeState(
  memento: vscode.Memento,
  key: string,
  state: MermaidThemeSlotState | undefined,
  expectedRevision: string | undefined,
  identity: string
): Promise<string | undefined> {
  const persistedState = memento.get<MermaidThemeSlotState>(key);
  if (persistedState?.revision !== expectedRevision) {
    throw new Error("Mermaid theme state changed in another extension host");
  }
  if (!state) {
    await memento.update(key, undefined);
    return undefined;
  }
  const revision = `${identity}:${Date.now()}:${++mermaidThemeStateRevision}`;
  await memento.update(key, { ...state, revision } satisfies MermaidThemeSlotState);
  state.revision = revision;
  return revision;
}

function getGlobalThemeStateKey(slot: MermaidThemeSlot): string {
  return `${stateKeyPrefix}.global.${slot}`;
}

function getWorkspaceThemeStateKey(identity: string, slot: MermaidThemeSlot): string {
  return `${stateKeyPrefix}.workspace.${encodeURIComponent(identity)}.${slot}`;
}

function hasMermaidExtension(): boolean {
  return mermaidExtensionIds.some((id) => vscode.extensions.getExtension(id) !== undefined);
}

function getOriginMermaidThemeConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(originSection.namespace);
}

function getWorkspaceIdentity(): string {
  if (vscode.workspace.workspaceFile) {
    return `workspace:${vscode.workspace.workspaceFile.toString(true)}`;
  }
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    return `folders:${workspaceFolders.map(({ uri }) => uri.toString(true)).join("\n")}`;
  }
  return "empty-window";
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
