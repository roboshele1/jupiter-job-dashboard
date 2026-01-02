// Renderer-level pinned snapshot (survives remounts per app session)

let pinnedSnapshot = null;
let pinnedAt = null;

export function getPinnedSignalsSnapshot() {
  return pinnedSnapshot;
}

export function setPinnedSignalsSnapshot(snapshot) {
  if (!pinnedSnapshot && snapshot) {
    pinnedSnapshot = snapshot;
    pinnedAt = Date.now();
  }
  return pinnedSnapshot;
}

export function clearPinnedSignalsSnapshot() {
  pinnedSnapshot = null;
  pinnedAt = null;
}

export function getPinnedAt() {
  return pinnedAt;
}

