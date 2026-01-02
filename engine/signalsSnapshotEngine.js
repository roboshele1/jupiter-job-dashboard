// engine/signalsSnapshotEngine.js
// Authoritative snapshot history + delta computation

let lastSnapshot = null;

function computeDelta(current, previous) {
  if (!previous) return "→";
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

function normalizeSignals(snapshot) {
  return snapshot.signals.map(s => {
    const prev = lastSnapshot?.signals?.find(p => p.symbol === s.symbol);
    return {
      ...s,
      delta: computeDelta(s.confidenceRank, prev?.confidenceRank),
    };
  });
}

function recordSnapshot(snapshot) {
  const normalized = {
    ...snapshot,
    signals: normalizeSignals(snapshot),
  };
  lastSnapshot = snapshot;
  return normalized;
}

module.exports = { recordSnapshot };

