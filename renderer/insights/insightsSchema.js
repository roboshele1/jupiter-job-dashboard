/**
 * Insights Schema — Phase 1A / 1B
 * Canonical, fully-initialized observer object
 */

export function createEmptyInsights() {
  return {
    meta: {
      mode: "observer",
      phase: "1A",
      status: "partial",
    },

    limits: [],
    warnings: [],

    snapshot: {
      available: false,
      timestamp: null,
    },

    portfolio: {
      available: false,
    },

    signals: {
      available: false,
    },

    risks: {
      warnings: [],
      limits: [],
    },

    sections: [],
  };
}

