import { watch, type FSWatcher } from "node:fs";
import { basename, dirname } from "node:path";

export function watchPreviewCss(path: string, onChange: () => void): FSWatcher {
  const fileName = basename(path);
  // Watch the directory so an atomic save cannot leave us watching the old inode.
  return watch(dirname(path), (_, changedFileName) => {
    if (changedFileName === null || changedFileName === fileName) onChange();
  });
}
