let latestSnapshot = {
  timestamp: new Date().toISOString(),
  totalValue: 90451.34,
  dailyPL: 0,
  dailyPLPct: 0,
};

export function setSnapshot(snapshot) {
  latestSnapshot = snapshot;
}

export function getSnapshot() {
  return latestSnapshot;
}

