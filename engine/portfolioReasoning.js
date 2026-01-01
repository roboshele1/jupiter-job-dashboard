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

    growthInteraction: {
      summary: null,
      note: null,
    },

    resilience: {
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

  /* -----------------------------
     Concentration (descriptive)
     ----------------------------- */
  if (Array.isArray(snapshot.topHoldings) && snapshot.topHoldings.length > 0) {
    reasoning.concentration.summary =
      "Top holdings are identifiable, allowing concentration context to be observed.";
    reasoning.concentration.note =
      "No thresholds or risk judgments are applied at this stage.";
  } else {
    reasoning.dataQuality.missingFields.push("topHoldings");
  }

  /* -----------------------------
     Diversification (descriptive)
     ----------------------------- */
  if (snapshot.allocation) {
    reasoning.diversification.summary =
      "Asset allocation data is present, enabling diversification context.";
    reasoning.diversification.note =
      "Diversification is described qualitatively, not scored.";
  } else {
    reasoning.dataQuality.missingFields.push("allocation");
  }

  /* -----------------------------
     Risk Exposure (descriptive)
     ----------------------------- */
  if (snapshot.dailyPLPct != null) {
    reasoning.riskExposure.summary =
      "Daily P/L percentage is available, providing short-term volatility context.";
    reasoning.riskExposure.note =
      "Volatility is observed, not evaluated.";
  } else {
    reasoning.dataQuality.missingFields.push("dailyPLPct");
  }

  /* -----------------------------
     Growth ↔ Risk Interaction
     ----------------------------- */
  if (snapshot.topHoldings && snapshot.allocation) {
    reasoning.growthInteraction.summary =
      "Portfolio structure suggests that growth outcomes are sensitive to concentration and allocation balance.";
    reasoning.growthInteraction.note =
      "This describes interaction pathways, not growth feasibility.";
  } else {
    reasoning.dataQuality.missingFields.push("growthInteractionInputs");
  }

  /* -----------------------------
     Resilience (drawdown intuition)
     ----------------------------- */
  if (snapshot.dailyPLPct != null && snapshot.topHoldings) {
    reasoning.resilience.summary =
      "Observed structure provides insight into how the portfolio may absorb short-term shocks.";
    reasoning.resilience.note =
      "Resilience is discussed conceptually, without stress testing.";
  } else {
    reasoning.dataQuality.missingFields.push("resilienceInputs");
  }

  if (reasoning.dataQuality.missingFields.length > 0) {
    reasoning.dataQuality.warnings.push(
      "Some reasoning outputs are limited due to incomplete snapshot inputs."
    );
  }

  return reasoning;
}

