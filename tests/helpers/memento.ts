import type vscode from "vscode";

export function createTestMemento(): vscode.Memento {
  const values = new Map<string, unknown>();
  return {
    get: <T>(key: string, defaultValue?: T) =>
      (values.has(key) ? values.get(key) : defaultValue) as T,
    update: async (key: string, value: unknown) => {
      if (value === undefined) values.delete(key);
      else values.set(key, value);
    },
    keys: () => [...values.keys()]
  };
}
