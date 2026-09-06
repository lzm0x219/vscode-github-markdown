import { once } from "node:events";
import { readFileSync, type FSWatcher } from "node:fs";
import { mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { watchPreviewCss } from "../../../scripts/build/css-watcher";

const watchers: FSWatcher[] = [];
const directories: string[] = [];

afterEach(async () => {
  for (const watcher of watchers.splice(0)) watcher.close();
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))
  );
});

async function createStylesheet(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "github-markdown-css-watch-"));
  directories.push(directory);
  const path = join(directory, "extension.preview.css");
  await writeFile(path, "a { color: black; }");
  return path;
}

describe("preview CSS changes", () => {
  it("continues notifying after atomic saves replace the stylesheet", async () => {
    const path = await createStylesheet();
    const observed: string[] = [];
    watchers.push(watchPreviewCss(path, () => observed.push(readFileSync(path, "utf8"))));

    for (const color of ["red", "green"]) {
      const replaced = `a { color: ${color}; }`;
      await writeFile(`${path}.tmp`, replaced);
      await rename(`${path}.tmp`, path);
      await vi.waitFor(() => expect(observed).toContain(replaced));

      const saved = `${replaced}\n/* saved again */`;
      await writeFile(path, saved);
      await vi.waitFor(() => expect(observed).toContain(saved));
    }
  });

  it("ignores other files in the stylesheet directory", async () => {
    const path = await createStylesheet();
    const onChange = vi.fn();
    watchers.push(watchPreviewCss(path, onChange));
    // macOS may deliver the fixture's creation event after the watcher is attached.
    await delay(100);
    onChange.mockClear();

    await writeFile(join(dirname(path), "other.css"), "a { color: red; }");
    await writeFile(`${path}.tmp`, "a { color: green; }");
    await delay(100);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("closes its watcher and stops notifying after disposal", async () => {
    const path = await createStylesheet();
    const onChange = vi.fn();
    const watcher = watchPreviewCss(path, onChange);
    watchers.push(watcher);
    const closed = once(watcher, "close");
    watcher.close();
    await closed;

    await writeFile(path, "a { color: red; }");
    await delay(100);

    expect(onChange).not.toHaveBeenCalled();
  });
});
