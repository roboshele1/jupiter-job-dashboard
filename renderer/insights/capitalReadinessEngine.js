/**
 * Capital Readiness Engine — V1
 * -----------------------------
 * Purpose:
 * Determines whether the system is structurally ready for capital deployment.
 * NOT advice. Read-only. Deterministic.
 */

export function runCapitalReadinessEngine(input = {}) {
  const {
    confidence = {},
    regimeImpact = {},
    riskFlags = {}
  } = input;

  const blockers = [];
  let readinessState = "READY";

  /* =========================
     CONFIDENCE GATE
     ========================= */
  if (confidence?.readiness === "NOT_READY") {
    readinessState = "NOT_READY";
    blockers.push({
      gate: "CONFIDENCE",
      severity: "CRITICAL",
      message: "Confidence trend does not support capital deployment."
    });
  }

  /* =========================
     REGIME ALIGNMENT GATE
     ========================= */
  if (regimeImpact?.mismatch === "HIGH") {
    if (readinessState === "READY") readinessState = "CAUTION";
    blockers.push({
      gate: "REGIME_ALIGNMENT",
      severity: "HIGH",
      message: "Portfolio structure misaligned with current market regime."
    });
  }

  /* =========================
     STRUCTURAL RISK GATE
     ========================= */
  if (riskFlags?.fragility === "EXTREME") {
    readinessState = "NOT_READY";
    blockers.push({
      gate: "STRUCTURAL_FRAGILITY",
      severity: "CRITICAL",
      message: "Extreme structural fragility detected."
    });
  }

  /* =========================
     CORRELATION RISK GATE
     ========================= */
  if (riskFlags?.correlationRisk === "HIGH") {
    if (readinessState === "READY") readinessState = "CAUTION";
    blockers.push({
      gate: "CORRELATION",
      severity: "HIGH",
      message: "High correlation risk limits safe deployment."
    });
  }

  /* =========================
     SUMMARY NARRATIVE
     ========================= */
  const narrative = [
    `Capital readiness state: ${readinessState}.`,
    `Confidence support level: ${confidence?.current?.confidenceBand || "UNKNOWN"}.`,
    `Market regime: ${regimeImpact?.regime || "UNKNOWN"}.`,
    blockers.length === 0
      ? "No structural blockers detected."
      : `Active blockers detected: ${blockers.length}.`
  ];

  return {
    meta: {
      engine: "CAPITAL_READINESS_V1",
      generatedAt: Date.now()
    },
    readinessState,
    confidenceSupport: confidence?.current?.confidenceBand || "UNKNOWN",
    regimeAlignment: regimeImpact?.regime || "UNKNOWN",
    blockers,
    summary: narrative.join(" ")
  };
}
