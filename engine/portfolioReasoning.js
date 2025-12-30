/**
 * Portfolio Reasoning Engine (Phase 3)
 * -----------------------------------
 * Purpose:
 * - Consume Dashboard snapshot (read-only)
 * - Produce structured explanations (no calculations, no advice)
 *
 * Constraints:
 * - No IPC
 * - No UI
 * - No portfolio mutations
 * - No predictions or recommendations
 */

export function derivePortfolioReasoning(snapshot) {
  const reasoning = {
    snapshot: {
      available: Boolean(snapshot),
      timestamp: snapshot?.timestamp ?? null,
    },
    concentration: {
      summary: null,
      note: null,
    },
    diversification: {
      summary: null,
      note: null,
    },
    riskExposure: {
      summary: null,
      note: null,
    },
    dataQuality: {
      missingFields: [],
      warnings: [],
    },
    system: {
      mode: "observer",
      phase: 3,
    },
  };

  if (!snapshot) {
    reasoning.dataQuality.warnings.push(
      "Dashboard snapshot unavailable; reasoning withheld."
    );
    reasoning.dataQuality.missingFields.push(
      "portfolioValue",
      "allocation",
      "topHoldings"
    );
    return reasoning;
  }

  // Concentration (explanatory only)
  if (Array.isArray(snapshot.topHoldings) && snapshot.topHoldings.length > 0) {
    reasoning.concentration.summary =
      "Top holdings present; concentration can be assessed qualitatively.";
    reasoning.concentration.note =
      "This reflects distribution visibility, not risk judgment.";
  } else {
    reasoning.dataQuality.missingFields.push("topHoldings");
  }

  // Diversification (explanatory only)
  if (snapshot.allocation) {
    reasoning.diversification.summary =
      "Asset allocation snapshot available; diversification context visible.";
    reasoning.diversification.note =
      "No diversification score is computed at this stage.";
  } else {
    reasoning.dataQuality.missingFields.push("allocation");
  }

  // Risk exposure (explanatory only)
  if (snapshot.dailyPLPct != null) {
    reasoning.riskExposure.summary =
      "Daily P/L percentage available; short-term volatility context visible.";
    reasoning.riskExposure.note =
      "Volatility interpretation is descriptive, not evaluative.";
  } else {
    reasoning.dataQuality.missingFields.push("dailyPLPct");
  }

  if (reasoning.dataQuality.missingFields.length > 0) {
    reasoning.dataQuality.warnings.push(
      "Some reasoning outputs withheld due to incomplete snapshot inputs."
    );
  }

  return reasoning;
}

