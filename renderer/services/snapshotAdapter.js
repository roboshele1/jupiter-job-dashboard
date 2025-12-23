// renderer/services/snapshotAdapter.js

import portfolioData from "../state/portfolioData";

/**
 * Deterministic snapshot builder.
 * Returns plain data, no stores, no async side effects.
 */
export function buildSnapshot() {
  if (!portfolioData || !Array.isArray(portfolioData.holdings)) {
    return [];
  }

  return portfolioData.holdings.map((h) => ({
    symbol: h.symbol,
    qty: h.qty,
    snapshotValue: Number(h.value),
    livePrice: null,
    delta: null,
    deltaPct: null,
  }));
}

/**
 * Backward-compatible accessor (some callers expect .then()).
 */
export function getSnapshotRows() {
  const rows = buildSnapshot();
  return Promise.resolve(rows);
}

