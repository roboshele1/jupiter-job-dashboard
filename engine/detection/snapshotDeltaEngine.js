import fs from "fs";
import path from "path";

const SNAPSHOT_DIR = path.resolve("engine/snapshots");

function getLatestSnapshots(limit = 2) {
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith("snapshot_"))
    .sort()
    .slice(-limit);

  return files.map(f => {
    const fullPath = path.join(SNAPSHOT_DIR, f);
    return require(fullPath);
  });
}

function computeAllocation(snapshot) {
  const total = snapshot?.snapshot?.totalValue || 0;
  if (!total) return {};

  const allocation = {};
  snapshot.snapshot.positions.forEach(p => {
    allocation[p.symbol] = (p.liveValue || p.snapshotValue || 0) / total;
  });

  return allocation;
}

function computeConcentration(snapshot) {
  const allocation = computeAllocation(snapshot);
  const values = Object.values(allocation);
  return values.length ? Math.max(...values) : 0;
}

function computeDrawdown(snapshotA, snapshotB) {
  const prev = snapshotA?.snapshot?.totalValue || 0;
  const curr = snapshotB?.snapshot?.totalValue || 0;
  if (!prev || !curr) return 0;
  return (curr - prev) / prev;
}

export function runSnapshotDeltaDetection() {
  const [prev, curr] = getLatestSnapshots(2);

  if (!prev || !curr) {
    return {
      status: "INSUFFICIENT_DATA",
      message: "Not enough snapshots to compute deltas."
    };
  }

  const prevAllocation = computeAllocation(prev);
  const currAllocation = computeAllocation(curr);

  const drift = {};
  Object.keys(currAllocation).forEach(symbol => {
    const before = prevAllocation[symbol] || 0;
    const after = currAllocation[symbol] || 0;
    drift[symbol] = after - before;
  });

  const detection = {
    timestamp: Date.now(),

    drawdown: computeDrawdown(prev, curr),

    concentrationChange:
      computeConcentration(curr) - computeConcentration(prev),

    allocationDrift: drift
  };

  return detection;
}
