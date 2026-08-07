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

export const section = { syncTheme: "mermaid.syncTheme" } as const;
export const themes = ["vscode", "base", "forest", "dark", "default", "neutral"] as const;
export type MermaidTheme = (typeof themes)[number];

type Target = vscode.ConfigurationTarget.Global | vscode.ConfigurationTarget.Workspace;
type Slot = "light" | "dark";
type SlotKey = typeof originSection.light | typeof originSection.dark;
type Pending =
  | { kind: "apply"; desired: MermaidTheme; previous?: MermaidTheme | undefined }
  | { kind: "restore"; desired?: MermaidTheme | undefined; previous?: MermaidTheme | undefined };
type SlotState = {
  version: 2;
  revision?: string;
  target: "global" | "workspace";
  workspaceIdentity?: string | undefined;
  original?: MermaidTheme | undefined;
  applied?: MermaidTheme;
  owner?: string;
  releasedBy?: string;
  pending?: Pending;
};
type LegacySnapshot = {
  light: MermaidTheme | undefined;
  dark: MermaidTheme | undefined;
  workspaceIdentity?: string;
  targets?: Record<Slot, Target>;
  applied?: Partial<Record<Slot, MermaidTheme>>;
  released?: Partial<Record<Slot, true>>;
};
type SlotContext = {
  key: SlotKey;
  target: Target;
  stateKey: string;
  state: SlotState | undefined;
};
type Transaction = SlotContext & {
  state: SlotState;
  previousState: SlotState | undefined;
  previousValue: MermaidTheme | undefined;
  desiredValue: MermaidTheme | undefined;
  shouldWrite: boolean;
};
type WriteOutcome = "released" | "skipped" | "written";
type ConfigurationUpdate = Pick<Transaction, "key" | "target" | "desiredValue" | "shouldWrite"> & {
  expectedValue: MermaidTheme | undefined;
  onOwnershipLost: () => Promise<void>;
};

const snapshotKey = "githubMarkdown.mermaid.originalGlobalThemes";
const stateKeyPrefix = "githubMarkdown.mermaid.themeState.v2";
const slots = [
  ["light", originSection.light],
  ["dark", originSection.dark]
] as const;
const mermaidExtensionIds = [
  "vscode.mermaid-markdown-features",
  "bierner.markdown-mermaid"
] as const;
let operationQueue: Promise<void> = Promise.resolve();

export function getMermaidSyncTheme(): boolean {
  return getConfiguration().get<boolean>(section.syncTheme, true);
}

export function updateMermaidThemeSync(memento: vscode.Memento): Promise<void> {
  return enqueue(() => updateNow(memento));
}

export function restoreMermaidThemeSync(
  memento: vscode.Memento,
  configuration = getOriginConfiguration()
): Promise<void> {
  return enqueue(() => restoreNow(memento, configuration));
}

async function updateNow(memento: vscode.Memento): Promise<void> {
  const configuration = getOriginConfiguration();
  if (!getMermaidSyncTheme()) {
    await restoreNow(memento, configuration);
    return;
  }
  if (!hasMermaidExtension() || !hasConfiguration(configuration)) return;

  const identity = getWorkspaceIdentity();
  await migrateSnapshot(memento, identity);
  const [light, dark] = resolveThemes();
  const desired = { light, dark };
  const transactions: Transaction[] = [];
  for (const [slot, key] of slots) {
    const target = getEffectiveTarget(configuration, key);
    if (target === vscode.ConfigurationTarget.Global) {
      await discardWorkspaceState(memento, identity, slot);
    }
    const context = loadContext(memento, identity, slot, key, target);
    const transaction = await prepareApply(
      memento,
      configuration,
      identity,
      context,
      desired[slot]
    );
    if (transaction) transactions.push(transaction);
  }

  const results = await executeTransactions(
    memento,
    configuration,
    identity,
    transactions,
    (transaction) => {
      const next = { ...transaction.state, applied: transaction.desiredValue as MermaidTheme };
      delete next.pending;
      return next;
    }
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status !== "rejected") return;

  try {
    await restoreNow(memento, configuration, true);
  } catch (restoreError) {
    const restoreFailures =
      restoreError instanceof AggregateError ? restoreError.errors : [restoreError];
    throw new AggregateError(
      [failure.reason, ...restoreFailures],
      `${failure.reason instanceof Error ? failure.reason.message : String(failure.reason)}; failed to restore the original Mermaid themes`
    );
  }
  throw failure.reason;
}

async function restoreNow(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration,
  preserveReleased = false
): Promise<void> {
  if (!hasConfiguration(configuration)) return;
  const identity = getWorkspaceIdentity();
  await migrateSnapshot(memento, identity);
  const transactions: Transaction[] = [];
  for (const [slot, key] of slots) {
    for (const target of [
      vscode.ConfigurationTarget.Global,
      vscode.ConfigurationTarget.Workspace
    ] as const) {
      const context = loadContext(memento, identity, slot, key, target);
      if (context.state && !(preserveReleased && context.state.releasedBy !== undefined)) {
        transactions.push(prepareRestore(configuration, { ...context, state: context.state }));
      }
    }
  }
  const results = await executeTransactions(
    memento,
    configuration,
    identity,
    transactions,
    () => undefined
  );
  const failures = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);
  if (failures.length) {
    throw new AggregateError(failures, "Failed to restore the original Mermaid themes");
  }
}

async function prepareApply(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration,
  identity: string,
  context: SlotContext,
  desiredValue: MermaidTheme
): Promise<Transaction | undefined> {
  const previousValue = getThemeAtTarget(configuration, context.key, context.target);
  let state = context.state ? { ...context.state } : undefined;
  let reconciled = false;
  if (state?.pending?.kind === "apply") {
    reconciled = true;
    if (previousValue === state.pending.desired) state.applied = state.pending.desired;
    else if (previousValue !== state.pending.previous) state = release(state, identity);
    if (state.pending?.kind === "apply") delete state.pending;
  } else if (state?.pending?.kind === "restore") {
    reconciled = true;
    if (previousValue === state.pending.desired) state = undefined;
    else if (previousValue === state.pending.previous) delete state.pending;
    else state = release(state, identity);
  }
  if (state?.releasedBy !== undefined) {
    if (reconciled) await saveContext(memento, context, state);
    return undefined;
  }
  if (state?.applied !== undefined && previousValue !== state.applied) {
    await saveContext(memento, context, release(state, identity));
    return undefined;
  }

  const previousState = state ? { ...state } : undefined;
  state ??= {
    version: 2,
    target: context.target === vscode.ConfigurationTarget.Global ? "global" : "workspace",
    original: previousValue
  };
  if (context.target === vscode.ConfigurationTarget.Workspace) state.workspaceIdentity = identity;
  state.pending = { kind: "apply", desired: desiredValue, previous: previousValue };
  return { ...context, state, previousState, previousValue, desiredValue, shouldWrite: true };
}

function prepareRestore(
  configuration: vscode.WorkspaceConfiguration,
  context: SlotContext & { state: SlotState }
): Transaction {
  const previousValue = getThemeAtTarget(configuration, context.key, context.target);
  const state = { ...context.state };
  if (state.pending?.kind === "apply") {
    if (previousValue === state.pending.desired) state.applied = state.pending.desired;
    else if (previousValue !== state.pending.previous) delete state.applied;
    delete state.pending;
  }
  const pendingRestore = state.pending?.kind === "restore" ? state.pending : undefined;
  const shouldWrite = pendingRestore
    ? previousValue === pendingRestore.previous
    : state.applied !== undefined && previousValue === state.applied;
  const previousState = { ...state };
  if (shouldWrite) {
    state.pending = { kind: "restore", desired: state.original, previous: previousValue };
  }
  return {
    ...context,
    state,
    previousState,
    previousValue,
    desiredValue: state.original,
    shouldWrite
  };
}

function release(state: SlotState, identity: string): SlotState {
  const released = { ...state, releasedBy: identity };
  delete released.applied;
  delete released.owner;
  delete released.pending;
  return released;
}

async function executeTransactions(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration,
  identity: string,
  transactions: Transaction[],
  finalize: (transaction: Transaction) => SlotState | undefined
): Promise<PromiseSettledResult<WriteOutcome>[]> {
  const claimed: Transaction[] = [];
  try {
    for (const transaction of transactions) {
      await saveContext(memento, transaction, transaction.state);
      claimed.push(transaction);
    }
  } catch (claimError) {
    const failures = await restoreStates(memento, claimed);
    if (failures.length) throw new AggregateError([claimError, ...failures]);
    throw claimError;
  }

  const results = await writeSequentially(
    configuration,
    transactions.map((transaction) => ({
      key: transaction.key,
      target: transaction.target,
      desiredValue: transaction.desiredValue,
      shouldWrite: transaction.shouldWrite,
      expectedValue: transaction.previousValue,
      onOwnershipLost: () => saveContext(memento, transaction, release(transaction.state, identity))
    }))
  );
  try {
    for (const [index, result] of results.entries()) {
      const transaction = transactions[index];
      if (result.status === "fulfilled" && result.value !== "released" && transaction) {
        await saveContext(memento, transaction, finalize(transaction));
      }
    }
  } catch (persistenceError) {
    const failures = await recoverTransactions(
      memento,
      configuration,
      identity,
      transactions,
      results
    );
    if (failures.length) throw new AggregateError([persistenceError, ...failures]);
    throw persistenceError;
  }
  return results;
}

async function recoverTransactions(
  memento: vscode.Memento,
  configuration: vscode.WorkspaceConfiguration,
  identity: string,
  transactions: Transaction[],
  results: PromiseSettledResult<WriteOutcome>[]
): Promise<unknown[]> {
  const updates = transactions.map((transaction, index): ConfigurationUpdate => {
    const current = getThemeAtTarget(configuration, transaction.key, transaction.target);
    return {
      key: transaction.key,
      target: transaction.target,
      desiredValue: transaction.previousValue,
      expectedValue: transaction.desiredValue,
      shouldWrite:
        results[index]?.status === "fulfilled" &&
        results[index].value === "written" &&
        transaction.shouldWrite &&
        current === transaction.desiredValue,
      onOwnershipLost: () => saveContext(memento, transaction, release(transaction.state, identity))
    };
  });
  const recoveryResults = await writeSequentially(configuration, updates);
  const failures = recoveryResults
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);
  const restoredTransactions = transactions.filter((_, index) => {
    const result = recoveryResults[index];
    const primaryResult = results[index];
    const wasReleased = primaryResult?.status === "fulfilled" && primaryResult.value === "released";
    return result?.status === "fulfilled" && result.value !== "released" && !wasReleased;
  });
  failures.push(...(await restoreStates(memento, restoredTransactions)));
  return failures;
}

async function restoreStates(
  memento: vscode.Memento,
  transactions: Transaction[]
): Promise<unknown[]> {
  const failures: unknown[] = [];
  for (const transaction of transactions) {
    try {
      await saveContext(memento, transaction, transaction.previousState);
    } catch (error) {
      failures.push(error);
    }
  }
  return failures;
}

async function writeSequentially(
  configuration: vscode.WorkspaceConfiguration,
  updates: ConfigurationUpdate[]
): Promise<PromiseSettledResult<WriteOutcome>[]> {
  const results: PromiseSettledResult<WriteOutcome>[] = [];
  for (const update of updates) {
    if (!update.shouldWrite) {
      results.push({ status: "fulfilled", value: "skipped" });
      continue;
    }
    try {
      if (getThemeAtTarget(configuration, update.key, update.target) !== update.expectedValue) {
        await update.onOwnershipLost();
        results.push({ status: "fulfilled", value: "released" });
        continue;
      }
      let outcome: WriteOutcome | undefined;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        await configuration.update(update.key, update.desiredValue, update.target);
        const current = getThemeAtTarget(configuration, update.key, update.target);
        if (current === update.desiredValue) {
          outcome = "written";
          break;
        }
        if (current !== update.expectedValue) {
          await update.onOwnershipLost();
          outcome = "released";
          break;
        }
      }
      if (!outcome) throw new Error(`Mermaid theme configuration did not settle for ${update.key}`);
      results.push({ status: "fulfilled", value: outcome });
    } catch (reason) {
      results.push({ status: "rejected", reason });
    }
  }
  return results;
}

function loadContext(
  memento: vscode.Memento,
  identity: string,
  slot: Slot,
  key: SlotKey,
  target: Target
): SlotContext {
  const stateKey = getStateKey(identity, target, slot);
  const persisted = memento.get<SlotState>(stateKey);
  const valid =
    persisted?.version === 2 &&
    persisted.target === (target === vscode.ConfigurationTarget.Global ? "global" : "workspace") &&
    (target === vscode.ConfigurationTarget.Global || persisted.workspaceIdentity === identity);
  return {
    key,
    target,
    stateKey,
    state: valid ? { ...persisted } : undefined
  };
}

async function saveContext(
  memento: vscode.Memento,
  context: SlotContext,
  state: SlotState | undefined
): Promise<void> {
  if (!state) {
    await memento.update(context.stateKey, undefined);
    context.state = undefined;
    return;
  }
  const next = { ...state };
  delete next.revision;
  await memento.update(context.stateKey, next);
  context.state = next;
}

async function discardWorkspaceState(
  memento: vscode.Memento,
  identity: string,
  slot: Slot
): Promise<void> {
  const stateKey = getWorkspaceStateKey(identity, slot);
  const persisted = memento.get<SlotState>(stateKey);
  if (!persisted) return;
  const context: SlotContext = {
    key: slot === "light" ? originSection.light : originSection.dark,
    target: vscode.ConfigurationTarget.Workspace,
    stateKey,
    state: persisted
  };
  await saveContext(memento, context, undefined);
}

async function migrateSnapshot(memento: vscode.Memento, currentIdentity: string): Promise<void> {
  const snapshot = memento.get<LegacySnapshot>(snapshotKey);
  if (!snapshot) return;
  for (const slot of ["light", "dark"] as const) {
    const target = snapshot.targets?.[slot] ?? vscode.ConfigurationTarget.Global;
    const identity = snapshot.workspaceIdentity;
    if (target === vscode.ConfigurationTarget.Workspace && !identity) continue;
    const state: SlotState = {
      version: 2,
      target: target === vscode.ConfigurationTarget.Workspace ? "workspace" : "global",
      original: snapshot[slot]
    };
    if (target === vscode.ConfigurationTarget.Workspace) state.workspaceIdentity = identity;
    if (snapshot.applied?.[slot] !== undefined) state.applied = snapshot.applied[slot];
    if (snapshot.released?.[slot]) {
      state.releasedBy = identity ?? currentIdentity;
      delete state.applied;
    }
    const key = getStateKey(identity ?? currentIdentity, target, slot);
    if (memento.get(key) === undefined) await memento.update(key, state);
  }
  await memento.update(snapshotKey, undefined);
}

function enqueue(operation: () => Promise<void>): Promise<void> {
  const queued = operationQueue.then(operation);
  operationQueue = queued.catch(() => {});
  return queued;
}

function resolveThemes(): readonly [MermaidTheme, MermaidTheme] {
  const mode = getThemeMode();
  if (mode === "vscode") return ["vscode", "vscode"];
  if (mode === "single") {
    const theme = resolveTheme(getSingleTheme());
    return [theme, theme];
  }
  return [resolveTheme(getCurrentLightTheme()), resolveTheme(getCurrentDarkTheme())];
}

function resolveTheme(theme: Theme): MermaidTheme {
  return isLightTheme(theme) ? "default" : "dark";
}

function getWorkspaceIdentity(): string {
  if (vscode.workspace.workspaceFile)
    return `workspace:${vscode.workspace.workspaceFile.toString(true)}`;
  const folders = vscode.workspace.workspaceFolders;
  return folders?.length
    ? `folders:${folders.map(({ uri }) => uri.toString(true)).join("\n")}`
    : "empty-window";
}

function getWorkspaceStateKey(identity: string, slot: Slot): string {
  return `${stateKeyPrefix}.workspace.${encodeURIComponent(identity)}.${slot}`;
}

function getStateKey(identity: string, target: Target, slot: Slot): string {
  return target === vscode.ConfigurationTarget.Global
    ? `${stateKeyPrefix}.global.${slot}`
    : getWorkspaceStateKey(identity, slot);
}

function getOriginConfiguration(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration(originSection.namespace);
}

function hasConfiguration(configuration: vscode.WorkspaceConfiguration): boolean {
  return slots.every(([, key]) => configuration.inspect(key) !== undefined);
}

function hasMermaidExtension(): boolean {
  return mermaidExtensionIds.some((id) => vscode.extensions.getExtension(id) !== undefined);
}

function getThemeAtTarget(
  configuration: vscode.WorkspaceConfiguration,
  key: SlotKey,
  target: Target
): MermaidTheme | undefined {
  const inspected = configuration.inspect<MermaidTheme>(key);
  return target === vscode.ConfigurationTarget.Workspace
    ? inspected?.workspaceValue
    : inspected?.globalValue;
}

function getEffectiveTarget(configuration: vscode.WorkspaceConfiguration, key: SlotKey): Target {
  const inspected = configuration.inspect<MermaidTheme>(key);
  return inspected?.workspaceValue !== undefined
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
}
