/**
 * Risk Posture Engine — V1
 * --------------------------------
 * Deterministic classifier of overall portfolio risk posture.
 * Read-only. Renderer-safe. No advice.
 *
 * Inputs:
 * - portfolioSnapshot (normalized, optional)
 *
 * Outputs:
 * - posture level
 * - drivers (machine-readable)
 * - explanations (human-readable)
 */

export function computeRiskPosture({ portfolioSnapshot = {} } = {}) {
  const generatedAt = Date.now();

  const equityExposure = portfolioSnapshot.equityExposurePct ?? 0;
  const cryptoExposure = portfolioSnapshot.cryptoExposurePct ?? 0;
  const topWeight = portfolioSnapshot.topWeightPct ?? 0;
  const holdingsCount = portfolioSnapshot.holdingsCount ?? 0;

  const drivers = [];
  const explanations = [];

  // --- Concentration driver
  if (topWeight >= 35) {
    drivers.push("extreme_concentration");
    explanations.push(
      "A single position dominates the portfolio, increasing drawdown risk."
    );
  } else if (topWeight >= 25) {
    drivers.push("high_concentration");
    explanations.push(
      "One holding represents a large portion of the portfolio."
    );
  }

  // --- Exposure balance driver
  if (equityExposure >= 80) {
    drivers.push("equity_dominant");
    explanations.push(
      "Portfolio risk is primarily driven by equity market movements."
    );
  }

  if (cryptoExposure >= 30) {
    drivers.push("crypto_volatility");
    explanations.push(
      "Crypto exposure meaningfully increases volatility and tail risk."
    );
  }

  // --- Diversification driver
  if (holdingsCount <= 5) {
    drivers.push("low_diversification");
    explanations.push(
      "Limited number of holdings reduces diversification benefits."
    );
  }

  // --- Posture classification (deterministic ladder)
  let posture = "LOW";

  if (drivers.includes("extreme_concentration")) {
    posture = "CRITICAL";
  } else if (
    drivers.includes("high_concentration") ||
    drivers.includes("crypto_volatility")
  ) {
    posture = "HIGH";
  } else if (
    drivers.includes("equity_dominant") ||
    drivers.includes("low_diversification")
  ) {
    posture = "MODERATE";
  }

  return {
    meta: {
      engine: "RISK_POSTURE_V1",
      generatedAt
    },

    posture,

    drivers,

    explanations,

    guarantees: {
      deterministic: true,
      readOnly: true,
      rendererSafe: true,
      noAdvice: true
    }
  };
}
