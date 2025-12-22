// renderer/state/snapshotStore.js
let snapshot = null;
const listeners = new Set();

export function writeSnapshot(next) {
  snapshot = next;
  listeners.forEach(fn => fn(snapshot));
}

export function readSnapshot() {
  return snapshot;
}

export function subscribeSnapshot(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

