// engine/portfolioEngine.js
// D8.2 — Canonical Portfolio Engine (Live Price Spine + Cost Basis Injection)
// -------------------------------------------------------------------------
// Source of truth for portfolio valuation.
// Delegates pricing to valuePortfolio (Polygon / Coinbase).
// Injects authoritative cost basis (read-only) before valuation.
// Deterministic per invocation.

import { valuePortfolio } from "./portfolio/portfolioValuation.js";
import COST_BASIS_V1 from "./data/costBasis.v1.js";

// NOTE:
// Holdings are defined upstream (IPC layer).
// This engine does NOT mutate authority.
// It composes holdings + cost basis read-only.

export async function getPortfolioSnapshot(holdings = []) {
  if (!Array.isArray(holdings)) holdings = [];

  const costBasisTotals = COST_BASIS_V1?.totals ?? {};

  const enrichedHoldings = holdings.map((h) => {
    const costBasis = costBasisTotals[h.symbol];

    if (typeof costBasis === "number") {
      return {
        ...h,
        totalCostBasis: costBasis
      };
    }

    return h;
  });

  const valuation = await valuePortfolio(enrichedHoldings);

  return {
    contract: valuation.contract,
    currency: valuation.currency,
    timestamp: Date.now(),

    totalValue: valuation.totals.liveValue,
    totalCost: valuation.totals.snapshotValue,
    delta: valuation.totals.delta,
    deltaPct: valuation.totals.deltaPct,

    positions: valuation.positions,

    priceSnapshotMeta: valuation.priceSnapshotMeta || null
  };
}

