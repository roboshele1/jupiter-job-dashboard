// renderer/state/snapshotStore.js

let snapshot = null;
let prevSnapshot = null;
const listeners = new Set();

export function writeSnapshot(next) {
  prevSnapshot = snapshot;
  snapshot = next;
  listeners.forEach(fn => fn(snapshot, prevSnapshot));
}

export function readSnapshot() {
  return snapshot;
}

export function readPrevSnapshot() {
  return prevSnapshot;
}

export function subscribeSnapshot(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

