// renderer/state/snapshotStore.js

let snapshot = null;
let history = [];

export function writeSnapshot(next) {
  snapshot = next;

  history.push({
    timestamp: next.timestamp,
    totalValue: next.totalValue,
    dailyPL: next.dailyPL ?? 0,
  });

  if (history.length > 30) history.shift();
}

export function getSnapshot() {
  return snapshot;
}

export function getPLHistory() {
  return history;
}

