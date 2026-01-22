/**
 * Conviction Drift vs Capital Allocation Comparator — V1
 * ------------------------------------------------------
 * Purpose:
 * - Detects mismatch between conviction evolution and capital allocation
 * - Deterministic, time-aware, signal-free
 *
 * Scope:
 * - Insights-only
 * - Read-only
 * - No UI assumptions
 */

export function runConvictionDriftComparator({
  convictionEvolution = [],
  exposure = {},
  confidence = {}
}) {
  const results = [];

  const topSymbol = exposure?.topHolding;
  const topWeight = exposure?.topWeightPct ?? 0;

  for (const row of convictionEvolution) {
    let status = "ALIGNED";
    let severity = "LOW";
    let message = "Capital allocation aligns with conviction state.";

    // Over-allocation while conviction is weak
    if (
      row.convictionZone === "ACCUMULATE" &&
      row.confidenceState === "LOW" &&
      row.symbol === topSymbol &&
      topWeight > 30
    ) {
      status = "DRIFT";
      severity = "MODERATE";
      message =
        "Capital concentration exceeds conviction strength during accumulation phase.";
    }

    // Severe mismatch: core accumulation not reflected
    if (
      row.convictionZone === "CORE_ACCUMULATE" &&
      row.symbol !== topSymbol &&
      topWeight > 40
    ) {
      status = "DRIFT";
      severity = "HIGH";
      message =
        "Portfolio remains concentrated away from highest-conviction asset.";
    }

    results.push({
      symbol: row.symbol,
      convictionZone: row.convictionZone,
      capitalWeightPct: row.symbol === topSymbol ? topWeight : "NON_CORE",
      status,
      severity,
      message,
      guarantees: {
        deterministic: true,
        readOnly: true,
        signalFree: true
      }
    });
  }

  return results;
}
