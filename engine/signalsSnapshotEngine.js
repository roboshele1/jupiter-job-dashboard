// engine/signalsSnapshotEngine.js
// Signals Snapshot History — Delta authority

let lastSnapshot = null;

const CONFIDENCE_ORDER = { Low: 1, Medium: 2, High: 3 };

function computeDelta(currentRank, previousRank) {
  if (previousRank == null) return "→";
  if (currentRank > previousRank) return "↑";
  if (currentRank < previousRank) return "↓";
  return "→";
}

function recordSnapshot(snapshot) {
  const normalizedSignals = snapshot.signals.map(s => {
    const prev = lastSnapshot?.signals?.find(p => p.symbol === s.symbol);
    return {
      ...s,
      delta: computeDelta(
        s.confidenceRank,
        prev?.confidenceRank
      )
    };
  });

  const normalized = {
    ...snapshot,
    signals: normalizedSignals
  };

  lastSnapshot = normalized;
  return normalized;
}

module.exports = Object.freeze({ recordSnapshot });
