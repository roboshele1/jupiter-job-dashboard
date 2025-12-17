/**
 * JUPITER v1 — Canonical Portfolio Contract
 * This file defines the single authoritative shape
 * of portfolio data consumed by ALL engines and ALL UIs.
 * No UI or alert may compute its own numbers.
 */

module.exports = {
  snapshotVersion: "v1",

  /**
   * Canonical Portfolio Snapshot
   */
  snapshot: {
    meta: {
      asOf: "number",              // timestamp (ms)
      source: "engine",             // constant
      refreshCycle: "deterministic" // declarative
    },

    positions: [
      {
        symbol: "string",
        assetClass: "CRYPTO | EQUITY",
        quantity: "number",
        price: "number",
        marketValue: "number",
        costBasis: "number",
        unrealizedPnL: "number",
        unrealizedPnLPct: "number"
      }
    ],

    totals: {
      totalValue: "number",
      cryptoValue: "number",
      equitiesValue: "number",

      totalUnrealizedPnL: "number",
      totalUnrealizedPnLPct: "number"
    },

    allocation: {
      bands: [
        {
          assetClass: "CRYPTO | EQUITY",
          currentPct: "number",
          targetPct: "number",
          minPct: "number",
          maxPct: "number",
          status: "UNDER | IN_BAND | OVER",
          deltaPct: "number"
        }
      ]
    }
  }
};

