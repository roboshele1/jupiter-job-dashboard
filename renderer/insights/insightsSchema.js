/**
 * Insights Schema — Canonical
 * Phase 1B baseline
 */

export function createEmptyInsights() {
  return {
    meta: {
      mode: "observer",
      phase: "1A",
      status: "partial",
    },

    // GLOBAL ARRAYS (ONLY ARRAYS THAT RULES MAY PUSH INTO)
    limits: [],
    warnings: [],

    // GUARANTEED OBJECTS (RULES MAY MUTATE FIELDS ONLY)
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
      available: false,
    },
  };
}

