// renderer/engine/interpretationEngine.js
// Phase 3 Interpretation Engine
// Converts raw dashboard truth into structured interpretation
// Read-only, deterministic, no inference

export function interpretDashboard(dashboardTruth) {
  const missing = [];

  if (!dashboardTruth?.portfolioValue) missing.push("portfolioValue");
  if (!dashboardTruth?.dailyPL) missing.push("dailyPL");
  if (!dashboardTruth?.dailyPLPct) missing.push("dailyPLPct");
  if (!dashboardTruth?.allocation) missing.push("allocation");
  if (!dashboardTruth?.topHoldings) missing.push("topHoldings");

  return {
    snapshot: {
      available: Boolean(dashboardTruth?.snapshotTimestamp),
      timestamp: dashboardTruth?.snapshotTimestamp ?? null
    },
    portfolio: {
      totalValue: dashboardTruth?.portfolioValue ?? null,
      dailyPL: dashboardTruth?.dailyPL ?? null,
      dailyPLPct: dashboardTruth?.dailyPLPct ?? null
    },
    allocation: {
      summary: dashboardTruth?.allocation ?? null,
      notes: []
    },
    holdings: {
      top: dashboardTruth?.topHoldings ?? [],
      concentrationNote: null
    },
    dataQuality: {
      missingFields: missing,
      warnings: dashboardTruth?.snapshotTimestamp
        ? []
        : ["Snapshot timestamp unavailable"]
    },
    system: {
      mode: "observer",
      phase: 3
    }
  };
}

