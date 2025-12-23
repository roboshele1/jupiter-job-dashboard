/**
 * insightsSchema
 * --------------
 * Canonical output contract for Insights tab.
 * Phase 4 — Read-only, deterministic, auditable.
 */

export function createEmptyInsights() {
  return {
    snapshot: {
      available: false,
      timestamp: null
    },

    portfolio: {
      totalValue: null,
      allocationSummary: null,
      concentrationNote: null
    },

    signals: {
      available: [],
      missing: [],
      notes: []
    },

    risks: {
      observations: [],
      dataLimitations: []
    },

    system: {
      mode: "observer",
      phase: 4
    }
  };
}

