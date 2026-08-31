import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";

const staticRequirePattern = /\brequire\s*\(\s*(["'])([^"']+)\1\s*\)/g;
const allowedExternalModules = new Set(["vscode"]);
const numberFormat = new Intl.NumberFormat("en-US");
export const maximumExtensionBundleBytes = 96 * 1024;

export function findUnexpectedExternalModules(source: string): string[] {
  const externalModules = new Set<string>();
  for (const match of source.matchAll(staticRequirePattern)) {
    const moduleName = match[2];
    if (moduleName && !allowedExternalModules.has(moduleName)) externalModules.add(moduleName);
  }
  return [...externalModules].sort();
}

export function assertExtensionBundleDependencies(source: string): void {
  const unexpected = findUnexpectedExternalModules(source);
  if (unexpected.length === 0) return;
  throw new Error(`Unexpected external modules in extension bundle: ${unexpected.join(", ")}`);
}

export function assertExtensionBundleSize(source: string): void {
  const bytes = Buffer.byteLength(source);
  if (bytes <= maximumExtensionBundleBytes) return;
  throw new Error(
    `Extension bundle size ${numberFormat.format(bytes)} bytes exceeds ${numberFormat.format(maximumExtensionBundleBytes)} bytes`
  );
}

export async function verifyExtensionBundle(path: string): Promise<void> {
  const source = await readFile(path, "utf8");
  assertExtensionBundleDependencies(source);
  assertExtensionBundleSize(source);
}
