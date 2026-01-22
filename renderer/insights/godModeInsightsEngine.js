/**
 * God Mode Insights Engine — V1.3
 * --------------------------------
 * Adds:
 * - Invariant violation detection
 * - Explicit rule breaking with severity
 * - God-mode judgment layer
 *
 * Node-only. Deterministic. Read-only.
 */

export function runGodModeInsights(input) {
  const generatedAt = Date.now();

  const positions =
    input?.snapshot?.portfolio?.positions ?? [];

  const insights = input?.insights ?? {};
  const marketRegime = input?.marketRegime ?? {
    regime: "TRANSITION",
    confidence: "LOW"
  };

  /* =========================
     BASIC EXPOSURE
     ========================= */
  const totalValue = positions.reduce(
    (sum, p) => sum + (p.liveValue || 0),
    0
  );

  const sorted = [...positions].sort(
    (a, b) => (b.liveValue || 0) - (a.liveValue || 0)
  );

  const top = sorted[0] || null;
  const topWeightPct =
    totalValue > 0 && top
      ? Number(((top.liveValue / totalValue) * 100).toFixed(2))
      : 0;

  /* =========================
     STRUCTURAL RISK FLAGS
     ========================= */
  let fragility = "LOW";
  if (topWeightPct > 45) fragility = "EXTREME";
  else if (topWeightPct > 30) fragility = "HIGH";
  else if (topWeightPct > 20) fragility = "MODERATE";

  let correlationRisk =
    insights.growthTilt === "GROWTH_HEAVY" ? "HIGH" : "LOW";

  let convictionDrift = "ALIGNED";
  if (
    insights.confidenceBand === "LOW" &&
    topWeightPct > 35
  ) {
    convictionDrift =
      "OVER-ALLOCATED RELATIVE TO CONFIDENCE";
  }

  /* =========================
     IMPLICIT BET
     ========================= */
  let implicitBet = "BALANCED";
  if (
    insights.growthTilt === "GROWTH_HEAVY" &&
    topWeightPct > 35
  ) {
    implicitBet = "SINGLE-THEME GROWTH";
  }

  /* =========================
     REGIME-AWARE DELTA
     ========================= */
  let regimeMismatch = "LOW";
  let regimeDeltaNarrative = null;

  if (marketRegime.regime === "RISK_OFF" && implicitBet !== "BALANCED") {
    regimeMismatch = "HIGH";
    regimeDeltaNarrative =
      "Growth concentration conflicts with a risk-off regime.";
  }

  if (marketRegime.regime === "TRANSITION" && fragility === "EXTREME") {
    regimeMismatch = "HIGH";
    regimeDeltaNarrative =
      "Concentration amplifies uncertainty during regime transition.";
  }

  /* =========================
     SCENARIO STRESS
     ========================= */
  const scenarios = [
    {
      name: "Volatility Spike",
      weight:
        marketRegime.regime === "RISK_OFF" ? "HIGH" : "MODERATE",
      assessment:
        "High concentration magnifies downside volatility."
    },
    {
      name: "Risk-Off Regime",
      weight:
        marketRegime.regime === "RISK_OFF" ? "CRITICAL" : "MODERATE",
      assessment:
        "Growth-heavy posture misaligned with defensive conditions."
    },
    {
      name: "Confidence Repricing",
      weight:
        insights.confidenceBand === "LOW" ? "HIGH" : "MODERATE",
      assessment:
        "Capital allocation not justified by confidence signals."
    }
  ];

  /* =========================
     INVARIANT VIOLATIONS
     ========================= */
  const invariants = [];

  if (topWeightPct > 40 && insights.confidenceBand === "LOW") {
    invariants.push({
      rule: "MAX_SINGLE_POSITION_LOW_CONFIDENCE",
      status: "VIOLATED",
      severity: "CRITICAL",
      message:
        "Single holding exceeds 40% while confidence is LOW."
    });
  }

  if (
    insights.growthTilt === "GROWTH_HEAVY" &&
    marketRegime.regime === "RISK_OFF"
  ) {
    invariants.push({
      rule: "GROWTH_EXPOSURE_IN_RISK_OFF",
      status: "VIOLATED",
      severity: "HIGH",
      message:
        "Growth-heavy portfolio during a risk-off regime."
    });
  }

  if (fragility === "EXTREME") {
    invariants.push({
      rule: "STRUCTURAL_FRAGILITY_LIMIT",
      status: "VIOLATED",
      severity: "HIGH",
      message:
        "Portfolio structure is extremely fragile due to concentration."
    });
  }

  /* =========================
     NARRATIVE
     ========================= */
  const narrative = [];

  if (top) {
    narrative.push(
      `Top holding represents ${topWeightPct}% of total capital.`
    );
  }

  narrative.push(
    `Portfolio is implicitly betting on: ${implicitBet}.`
  );

  narrative.push(
    `Structural fragility level: ${fragility}.`
  );

  if (regimeDeltaNarrative) {
    narrative.push(regimeDeltaNarrative);
  }

  if (convictionDrift !== "ALIGNED") {
    narrative.push(
      `Capital vs confidence drift: ${convictionDrift}.`
    );
  }

  if (invariants.length > 0) {
    narrative.push(
      `Invariant violations detected: ${invariants.length}.`
    );
  }

  /* =========================
     FINAL OUTPUT
     ========================= */
  return {
    meta: {
      generatedAt,
      engine: "GOD_MODE_V1.3"
    },

    exposure: {
      totalValue,
      topHolding: top?.symbol ?? null,
      topWeightPct,

      // ✅ APPEND-ONLY ADDITION (NO SIDE EFFECTS)
      symbols: sorted.map(p => p.symbol)
    },

    riskFlags: {
      fragility,
      regimeMismatch,
      convictionDrift,
      correlationRisk
    },

    implicitBet,

    regimeImpact: {
      regime: marketRegime.regime,
      confidence: marketRegime.confidence,
      mismatch: regimeMismatch
    },

    scenarios,

    invariants,

    narrative
  };
}
