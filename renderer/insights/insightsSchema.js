/**
 * Insights Schema — Phase 1A (Observer Intelligence)
 *
 * Guarantees:
 * - All fields are always present
 * - Safe defaults for degraded / partial modes
 * - Engine layers never guard for undefined
 */

export function createEmptyInsights() {
  return {
    meta: {
      mode: "observer",
      phase: "1A",
      status: "unknown",
      snapshotTimestamp: null,
      generatedAt: null,
    },

    limits: [],
    warnings: [],

    snapshot: {
      available: false,
    },

    portfolio: {
      totalValue: null,
      allocation: null,
      topHoldings: [],
    },

    signals: {
      available: [],
      missing: [],
    },

    risks: {
      observations: [],
    },
  };
}

