/**
 * interpretationSchema
 * --------------------
 * Canonical output shape for Chat interpretation.
 * This is READ-ONLY and deterministic.
 */

export function createEmptyInterpretation() {
  return {
    snapshot: {
      available: false,
      timestamp: null
    },

    portfolio: {
      totalValue: null,
      dailyPL: null,
      dailyPLPct: null
    },

    allocation: {
      summary: null,
      notes: []
    },

    holdings: {
      top: [],
      concentrationNote: null
    },

    dataQuality: {
      missingFields: [],
      warnings: []
    },

    system: {
      mode: "observer",
      phase: 3
    }
  };
}

