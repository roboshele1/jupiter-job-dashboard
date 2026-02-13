/**
 * Snapshot Valuation Enricher
 * ---------------------------
 * Deterministic bridge:
 * RAW SNAPSHOT → PRICED POSITIONS → TOTALS
 *
 * D3 CHANGE:
 * - Unified pricing authority
 * - Uses resolvePrices (same as Portfolio tab)
 *
 * Rules:
 * - Read-only inputs
 * - Append-only output
 * - No forecasting
 * - No decision logic
 * - No mutation of original snapshot
 */

import { resolvePrices } from "../market/priceResolver.js";
import { computeTotals } from "../portfolioTotals.js";

/**
 * enrichSnapshotWithValuation
 * Accepts raw snapshot object:
 * {
 *   holdings: [{ symbol, quantity }]
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

  // Normalize holdings → resolver contract
  const normalizedHoldings = snapshot.holdings.map(h => ({
    symbol: h.symbol,
    quantity: h.qty ?? h.quantity ?? 0,
    assetClass:
      h.symbol === "BTC" || h.symbol === "ETH" ? "crypto" : "equity"
  }));

  // =========================
  // 🟢 D3 — UNIFIED PRICE AUTHORITY
  // =========================
  const priceSnapshot = await resolvePrices(
    normalizedHoldings.map(h => ({
      symbol: h.symbol,
      assetClass: h.assetClass
    }))
  );

  const prices = priceSnapshot?.prices || {};

  let totalValue = 0;

  const positions = normalizedHoldings.map(h => {
    const row = prices[h.symbol] || {};
    const price = Number(row.price) || 0;
    const value = price * (Number(h.quantity) || 0);

    totalValue += value;

    return {
      symbol: h.symbol,
      qty: h.quantity,
      price,
      value,
      source: row.source || "unknown"
    };
  });

  // =========================
  // TOTALS
  // =========================
  const totals = computeTotals(
    positions.map(p => ({
      marketValue: p.value,
      assetClass:
        p.symbol === "BTC" || p.symbol === "ETH" ? "CRYPTO" : "EQUITY",
      unrealizedPnL: 0
    }))
  );

  // =========================
  // RETURN
  // =========================
  return {
    ...snapshot,
    positions,
    totals,
    valuationMetadata: {
      enrichedAt: Date.now(),
      source: "snapshotValuationEnricher",
      pricingAuthority: "UNIFIED_PRICE_RESOLVER",
      pricingCoverage: {
        totalHoldings: normalizedHoldings.length,
        pricedPositions: positions.filter(p => p.price > 0).length
      }
    }
  };
}
