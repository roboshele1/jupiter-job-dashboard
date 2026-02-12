import fs from "fs";
import path from "path";

const SNAPSHOT_DIR = path.resolve("engine/snapshots");

/**
 * Deterministic snapshot selection by modification time
 */
function getLatestSnapshots(limit = 2) {
  const files = fs
    .readdirSync(SNAPSHOT_DIR)
    .filter(f => f.startsWith("snapshot_") && f.endsWith(".json"))
    .map(f => ({
      name: f,
      mtime: fs.statSync(path.join(SNAPSHOT_DIR, f)).mtimeMs
    }))
    .sort((a, b) => a.mtime - b.mtime)
    .slice(-limit)
    .map(f => f.name);

  return files.map(f => {
    const fullPath = path.join(SNAPSHOT_DIR, f);
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  });
}

/**
 * Extract positions from flexible snapshot schemas
 */
function extractPositions(snapshot) {
  if (!snapshot) return [];

  if (snapshot?.snapshot?.positions) return snapshot.snapshot.positions;
  if (snapshot?.positions) return snapshot.positions;
  if (snapshot?.holdings) return snapshot.holdings;

  return [];
}

/**
 * Compute total value directly from holdings
 */
function computeTotalValue(snapshot) {
  const positions = extractPositions(snapshot);
  if (!positions.length) return 0;

  return positions.reduce((sum, p) => {
    const price = p.price || p.livePrice || 0;
    const qty = p.quantity || p.qty || 0;
    return sum + price * qty;
  }, 0);
}

/**
 * Allocation computation from quantity × price
 */
function computeAllocation(snapshot) {
  const positions = extractPositions(snapshot);
  const total = computeTotalValue(snapshot);

  if (!total || !positions.length) return {};

  const allocation = {};

  positions.forEach(p => {
    const price = p.price || p.livePrice || 0;
    const qty = p.quantity || p.qty || 0;

    if (!p.symbol) return;

    allocation[p.symbol] = (price * qty) / total;
  });

  return allocation;
}

function computeConcentration(snapshot) {
  const allocation = computeAllocation(snapshot);
  const values = Object.values(allocation);
  return values.length ? Math.max(...values) : 0;
}

function computeDrawdown(snapshotA, snapshotB) {
  const prev = computeTotalValue(snapshotA);
  const curr = computeTotalValue(snapshotB);
  if (!prev || !curr) return 0;
  return (curr - prev) / prev;
}

/**
 * MAIN DETECTION ENGINE
 */
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

  return {
    timestamp: Date.now(),
    drawdown: computeDrawdown(prev, curr),
    concentrationChange:
      computeConcentration(curr) - computeConcentration(prev),
    allocationDrift: drift
  };
}
