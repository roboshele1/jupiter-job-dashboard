// renderer/state/portfolioSnapshotAdapter.js
// CONTRACT: Named exports ONLY. No default export.
// This adapter is the single read-only source for normalized portfolio snapshots.
// Consumers: Portfolio (owner), Risk Centre (consumer), Dashboard (consumer).

import { usePortfolioSnapshotStore } from "./portfolioSnapshotStore";

/**
 * Read-only hook for consumers (Risk Centre, Dashboard).
 * Returns the latest normalized snapshot written by Portfolio bootstrap.
 */
export function usePortfolioSnapshot() {
  const snapshot = usePortfolioSnapshotStore((s) => s.snapshot);
  return snapshot ?? null;
}

/**
 * Selector helpers (pure, defensive).
 */
export function getSnapshotTimestamp(snapshot) {
  return snapshot?.timestamp ?? null;
}

export function getSnapshotHoldings(snapshot) {
  return Array.isArray(snapshot?.holdings) ? snapshot.holdings : [];
}

export function getSnapshotTotalValue(snapshot) {
  return typeof snapshot?.totalValue === "number" ? snapshot.totalValue : 0;
}

/**
 * Aggregations (read-only, no side effects).
 */
export function derivePerAssetValue(snapshot) {
  const holdings = getSnapshotHoldings(snapshot);
  const out = {};
  for (const h of holdings) {
    const symbol = h?.symbol;
    const value = typeof h?.marketValue === "number" ? h.marketValue : 0;
    if (!symbol) continue;
    out[symbol] = (out[symbol] ?? 0) + value;
  }
  return out;
}

export function deriveExposure(snapshot) {
  const holdings = getSnapshotHoldings(snapshot);
  let equity = 0;
  let crypto = 0;

  for (const h of holdings) {
    const value = typeof h?.marketValue === "number" ? h.marketValue : 0;
    if (h?.assetClass === "crypto") crypto += value;
    else equity += value;
  }

  const total = equity + crypto;
  return {
    equityPct: total > 0 ? (equity / total) * 100 : 0,
    cryptoPct: total > 0 ? (crypto / total) * 100 : 0,
  };
}

