/**
 * Insights Engine — Phase 1C
 * Deterministic interpreter of normalized snapshot contract
 */

export function generateInsights(input = {}) {
  const snapshotAvailable = input.snapshot?.available === true;
  const portfolioAvailable = input.portfolio?.available === true;

  const status = snapshotAvailable && portfolioAvailable ? "ready" : "partial";

  return {
    meta: {
      mode: "observer",
      phase: "1C",
      status,
      generatedAt: new Date().toISOString()
    },

    snapshot: {
      available: snapshotAvailable,
      timestamp: input.snapshot?.timestamp ?? null
    },

    portfolio: {
      available: portfolioAvailable,
      totalValue: input.portfolio?.totalValue ?? null,
      allocation: input.portfolio?.allocation ?? null,
      topHoldings: input.portfolio?.topHoldings ?? []
    },

    limitations: snapshotAvailable ? [] : ["Snapshot not finalized"],
    warnings:
      snapshotAvailable && input.snapshot.timestamp
        ? []
        : ["Snapshot timestamp unavailable"]
  };
}

