/**
 * Snapshot Valuation Enricher
 * ---------------------------
 * Deterministic bridge:
 * RAW SNAPSHOT → PRICED POSITIONS → TOTALS
 *
 * Rules:
 * - Read-only inputs
 * - Append-only output
 * - No forecasting
 * - No decision logic
 * - No mutation of original snapshot
 */

import { pricePortfolio } from "../portfolioValuation.js";
import { computeTotals } from "../portfolioTotals.js";

/**
 * enrichSnapshotWithValuation
 * Accepts raw snapshot object:
 * {
 *   holdings: [{ symbol, quantity, price? }]
 * }
 *
 * Returns enriched snapshot:
 * {
 *   holdings,
 *   positions,
 *   totals,
 *   valuationMetadata
 * }
 */
export async function enrichSnapshotWithValuation(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.holdings)) {
    return null;
  }

  // Normalize holdings → qty contract expected by valuation engine
  const normalizedHoldings = snapshot.holdings.map(h => ({
    symbol: h.symbol,
    qty: h.qty ?? h.quantity ?? 0
  }));

  // 1) Price positions
  const { positions, totalValue } = await pricePortfolio(normalizedHoldings);

  // 2) Compute totals
  const totals = computeTotals(
    positions.map(p => ({
      marketValue: p.value,
      assetClass: p.symbol === "BTC" || p.symbol === "ETH" ? "CRYPTO" : "EQUITY",
      unrealizedPnL: 0
    }))
  );

  // 3) Return enriched structure (append-only)
  return {
    ...snapshot,
    positions,
    totals,
    valuationMetadata: {
      enrichedAt: Date.now(),
      source: "snapshotValuationEnricher",
      pricingCoverage: {
        totalHoldings: normalizedHoldings.length,
        pricedPositions: positions.filter(p => p.price > 0).length
      }
    }
  };
}
