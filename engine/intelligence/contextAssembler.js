/**
 * Context Assembler — Portfolio Intelligence Bridge
 * -------------------------------------------------
 * D4 — Intelligence Real Portfolio Wiring
 *
 * Purpose:
 * - Convert authoritative portfolio valuation into intelligence-ready context
 * - No scoring, no reasoning, no forecasting
 * - Deterministic data bridge only
 *
 * Inputs:
 * - Live portfolio valuation engine
 *
 * Outputs:
 * - Canonical intelligence context object
 */

import { loadLatestSnapshot } from "../snapshots/latestSnapshotResolver.js";
import { valuePortfolio } from "../portfolio/portfolioValuation.js";

/**
 * assembleIntelligenceContext
 * Returns deterministic portfolio context for intelligence layer.
 */
export async function assembleIntelligenceContext() {
  const snapshot = loadLatestSnapshot();

  if (!snapshot?.holdings) {
    return {
      contextAvailable: false,
      portfolioValue: 0,
      positions: [],
      totals: null,
      source: "no-snapshot"
    };
  }

  // Use authoritative valuation engine
  const valuation = await valuePortfolio(
    snapshot.holdings.map(h => ({
      symbol: h.symbol,
      qty: h.qty ?? h.quantity ?? 0,
      assetClass:
        h.symbol === "BTC" || h.symbol === "ETH"
          ? "crypto"
          : "equity",
      totalCostBasis: h.totalCostBasis ?? 0,
      currency: "USD"
    }))
  );

  return Object.freeze({
    contextAvailable: true,
    portfolioValue: valuation?.totals?.liveValue || 0,
    positions: valuation?.positions || [],
    totals: valuation?.totals || null,
    fetchedAt: valuation?.fetchedAt || null,
    source: "portfolioValuationAuthority"
  });
}
