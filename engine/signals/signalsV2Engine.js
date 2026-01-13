/**
 * Signals V2 Engine — Conditional Intelligence Surfacing
 * ------------------------------------------------------
 * Contract:
 * - Deterministic
 * - Read-only
 * - Silence-by-default
 *
 * Signals only surface when:
 * - Growth trajectory feasibility changes materially, OR
 * - Risk posture crosses a regime boundary
 *
 * Authority:
 * - Portfolio Snapshot (single source of truth)
 * - Growth V2 Capital Trajectory
 * - Risk Centre Outputs
 */

const CONFIDENCE_ORDER = { Low: 1, Medium: 2, High: 3 };

/* ======================================================
   HELPERS
====================================================== */

function classifyMateriality(deltaPct = 0) {
  if (Math.abs(deltaPct) >= 0.10) return "HIGH";
  if (Math.abs(deltaPct) >= 0.05) return "MODERATE";
  return "LOW";
}

function isGrowthDisruption(growthTrajectory) {
  if (!growthTrajectory) return false;

  const { verdict } = growthTrajectory;
  if (!verdict) return false;

  return verdict.classification !== "FEASIBLE";
}

function isRiskDisruption(riskSnapshot) {
  if (!riskSnapshot) return false;

  return (
    riskSnapshot.regime === "RISK_OFF" ||
    riskSnapshot.regime === "STRESS"
  );
}

function shouldSurfaceSignal({ growthTrajectory, riskSnapshot }) {
  return (
    isGrowthDisruption(growthTrajectory) ||
    isRiskDisruption(riskSnapshot)
  );
}

/* ======================================================
   CORE ENGINE
====================================================== */

export function buildSignalsV2Snapshot({
  portfolioSnapshot,
  growthTrajectory,
  riskSnapshot,
  confidenceEvaluations = []
} = {}) {
  const timestamp = Date.now();

  // HARD SILENCE — nothing to say
  if (!shouldSurfaceSignal({ growthTrajectory, riskSnapshot })) {
    return {
      contract: "SIGNALS_V2",
      timestamp,
      surfaced: false,
      signals: [],
      notes: [
        "No material growth or risk disruption detected.",
        "Signals engine intentionally silent."
      ]
    };
  }

  const signals = [];

  const positions = Array.isArray(portfolioSnapshot?.holdings)
    ? portfolioSnapshot.holdings
    : [];

  for (const p of positions) {
    const evalResult = confidenceEvaluations.find(
      e => e.symbol === p.symbol
    );

    const confidence =
      evalResult?.confidenceTransition?.nextConfidence || "Low";

    const materiality = classifyMateriality(p.deltaPct ?? 0);

    // Skip low-importance assets unless confidence is high
    if (materiality === "LOW" && confidence !== "High") continue;

    signals.push({
      symbol: p.symbol,
      assetClass: p.assetClass,
      confidence,
      confidenceRank: CONFIDENCE_ORDER[confidence],
      materiality,
      growthImpact: isGrowthDisruption(growthTrajectory)
        ? "CONSTRAINED"
        : "NEUTRAL",
      riskContext: riskSnapshot?.regime || "UNKNOWN"
    });
  }

  return {
    contract: "SIGNALS_V2",
    timestamp,
    surfaced: signals.length > 0,
    signals,
    notes: [
      "Signals surfaced due to material growth or risk disruption.",
      "Silence-by-default policy enforced.",
      "No recommendations issued."
    ]
  };
}
