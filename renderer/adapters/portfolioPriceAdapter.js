// renderer/adapters/portfolioPriceAdapter.js
// JUPITER — Portfolio Price Adapter
// Read-only, deterministic, authoritative

import { usePortfolioSnapshotStore } from "../state/portfolioSnapshotStore";

/**
 * Read-only selector for portfolio-derived prices
 * @returns {Object} { [symbol]: { ok, price, source } }
 */
export function getPortfolioPrices() {
  const snapshot =
    usePortfolioSnapshotStore.getState().snapshot;

  if (!snapshot || !Array.isArray(snapshot.holdings)) {
    return {};
  }

  const prices = {};

  for (const h of snapshot.holdings) {
    if (!h?.symbol || typeof h.value !== "number") continue;

    prices[h.symbol] = {
      ok: true,
      price: h.value,
      source: "portfolio"
    };
  }

  return prices;
}

