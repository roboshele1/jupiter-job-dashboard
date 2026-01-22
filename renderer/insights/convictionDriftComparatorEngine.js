/**
 * Conviction Drift Comparator Engine — V1
 * ---------------------------------------
 * Purpose:
 * - Compare capital allocation vs conviction evolution
 * - Identify misaligned risk consumption
 * - Surface internal rotation candidates
 *
 * HARD RULES:
 * - Read-only
 * - No execution
 * - No signals
 * - Deterministic
 * - Insights-only
 */

export function runConvictionDriftComparator({
  exposure = {},
  convictionEvolution = []
}) {
  const results = [];

  const bySymbol = {};
  for (const row of convictionEvolution) {
    bySymbol[row.symbol] = row;
  }

  const positions = exposure?.bySymbol || [];

  for (const p of positions) {
    const symbol = p.symbol;
    const capitalValue = Number(p.liveValue || 0);

    const conviction = bySymbol[symbol];

    if (!conviction) {
      results.push({
        symbol,
        status: "UNCLASSIFIED",
        assessment:
          "No conviction data available for this holding.",
        actionBias: "REVIEW",
        guarantees: {
          deterministic: true,
          readOnly: true
        }
      });
      continue;
    }

    const zone = conviction.convictionZone;
    const days = conviction.daysInState;

    let drift = "ALIGNED";
    let actionBias = "HOLD";
    let assessment = "Capital and conviction are aligned.";

    if (zone === "ACCUMULATE" && capitalValue < exposure.totalValue * 0.05) {
      drift = "UNDER-ALLOCATED_RELATIVE_TO_CONVICTION";
      actionBias = "INTERNAL_ROTATE_IN";
      assessment =
        "Conviction has strengthened over time but capital allocation remains light.";
    }

    if (
      zone === "HOLD" &&
      capitalValue > exposure.totalValue * 0.25
    ) {
      drift = "OVER-ALLOCATED_RELATIVE_TO_CONVICTION";
      actionBias = "TRIM_OR_ROTATE_OUT";
      assessment =
        "Capital exposure is high without corresponding conviction reinforcement.";
    }

    if (zone === "ACCUMULATE" && days >= 180) {
      actionBias = "PRIORITY_ACCUMULATION";
      assessment =
        "Extended time-under-pressure confirms thesis resilience.";
    }

    results.push({
      symbol,
      convictionZone: zone,
      daysUnderPressure: days,
      capitalValue,
      drift,
      actionBias,
      assessment,
      guarantees: {
        deterministic: true,
        readOnly: true,
        signalFree: true
      }
    });
  }

  return results;
}
