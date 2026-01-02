// renderer/insights/insightsPipeline.js

export async function buildInsightsSnapshot(engineSnapshot) {
  const now = Date.now();

  const liveTotal =
    engineSnapshot?.totals?.liveValue ??
    engineSnapshot?.totalValue ??
    null;

  const hasValue = typeof liveTotal === "number" && !Number.isNaN(liveTotal);

  return {
    meta: {
      mode: "observer",
      phase: "1C",
      status: hasValue ? "ready" : "partial",
      generatedAt: new Date(now).toISOString()
    },

    snapshot: {
      available: hasValue,
      timestamp: engineSnapshot?._asOf ?? now
    },

    portfolio: {
      available: hasValue,
      totalValue: hasValue ? liveTotal : null,
      allocation: engineSnapshot?.allocation ?? null,
      topHoldings: engineSnapshot?.positions ?? []
    },

    limitations: hasValue ? [] : ["Snapshot not finalized"],

    warnings: hasValue ? [] : ["Snapshot timestamp unavailable"]
  };
}

