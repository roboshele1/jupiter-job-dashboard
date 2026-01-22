/**
 * Portfolio Conviction Allocator — V1
 * -----------------------------------
 * Purpose:
 * Rank EXISTING holdings by conviction pressure and capital efficiency.
 *
 * This engine answers:
 * - Which holdings deserve MORE capital?
 * - Which are consuming risk without increasing conviction?
 *
 * HARD RULES:
 * - Read-only
 * - No execution
 * - No portfolio mutation
 * - Insights-only authority
 * - Deterministic
 */

export function buildPortfolioConvictionAllocation({
  positions = [],
  confidence = {},
  regimeImpact = {}
}) {
  const generatedAt = Date.now();

  const rows = positions.map(p => {
    const daysUnderPressure =
      Number(p?.confidence?.time?.daysInState || 0);

    const convictionState =
      p?.confidence?.state || "UNKNOWN";

    const deltaPct =
      Number(p?.deltaPct ?? 0);

    let recommendation = "HOLD";

    if (
      convictionState === "LOW" &&
      daysUnderPressure >= 90
    ) {
      recommendation = "ACCUMULATE";
    }

    if (
      convictionState === "WEAK" &&
      daysUnderPressure >= 120
    ) {
      recommendation = "TRIM";
    }

    return {
      symbol: p.symbol,
      convictionState,
      daysUnderPressure,
      deltaPct,
      recommendation,
      rationale: buildRationale({
        convictionState,
        daysUnderPressure,
        deltaPct
      })
    };
  });

  return {
    meta: {
      engine: "PORTFOLIO_CONVICTION_ALLOCATOR_V1",
      generatedAt
    },

    rows,

    guarantees: {
      readOnly: true,
      deterministic: true,
      noExecution: true,
      noAdvice: true
    }
  };
}

/* =========================
   RATIONALE BUILDER
   ========================= */
function buildRationale({
  convictionState,
  daysUnderPressure,
  deltaPct
}) {
  if (
    convictionState === "LOW" &&
    daysUnderPressure >= 90
  ) {
    return "Conviction intact despite prolonged market pressure.";
  }

  if (
    convictionState === "WEAK" &&
    daysUnderPressure >= 120
  ) {
    return "Capital deployed without sustained conviction support.";
  }

  if (deltaPct < -20) {
    return "Drawdown exceeds typical regime stress thresholds.";
  }

  return "Position behaving within expected conviction bounds.";
}
