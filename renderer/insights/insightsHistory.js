// renderer/insights/insightsHistory.js
// Phase 2C — Snapshot History (read-only, deterministic)

let previousSnapshot = null;

export function getPreviousSnapshot() {
  return previousSnapshot;
}

export function setPreviousSnapshot(snapshot) {
  previousSnapshot = snapshot ? JSON.parse(JSON.stringify(snapshot)) : null;
}

