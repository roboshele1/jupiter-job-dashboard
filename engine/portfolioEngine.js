// engine/portfolioEngine.js
// D8.1 — Canonical Portfolio Engine (Live Price Spine)
// ----------------------------------------------------
// Source of truth for portfolio valuation.
// Delegates pricing to valuePortfolio (Polygon / Coinbase).
// Read-only. Deterministic per invocation.

import { valuePortfolio } from "./portfolio/portfolioValuation.js";

// NOTE:
// Holdings are currently defined upstream (IPC layer).
// This engine only values — it does not mutate or source holdings.

export async function getPortfolioSnapshot(holdings = []) {
  if (!Array.isArray(holdings)) holdings = [];

  const valuation = await valuePortfolio(holdings);

  return {
    contract: valuation.contract,
    currency: valuation.currency,
    timestamp: Date.now(),

    totalValue: valuation.totals.liveValue,
    totalCost: valuation.totals.snapshotValue,
    delta: valuation.totals.delta,
    deltaPct: valuation.totals.deltaPct,

    positions: valuation.positions,

    priceSnapshotMeta: valuation.priceSnapshotMeta || null,
  };
}

