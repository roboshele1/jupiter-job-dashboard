/**
 * Risk Scenario Engine — V1
 * --------------------------------
 * Deterministic stress scenario generator for Risk Centre.
 * Read-only. Renderer-safe. No advice.
 */

export function runRiskScenarios({ portfolioSnapshot = {} } = {}) {
  const generatedAt = Date.now();

  const {
    equityExposurePct = 0,
    cryptoExposurePct = 0,
    topWeightPct = 0,
    totalValue = 0
  } = portfolioSnapshot;

  const scenarios = [];

  // Scenario 1: Equity drawdown
  if (equityExposurePct > 0 && totalValue > 0) {
    const equityDrawdownPct = 0.2; // -20%
    const impact =
      totalValue * (equityExposurePct / 100) * equityDrawdownPct;

    scenarios.push({
      name: "Equity Drawdown",
      severity: "HIGH",
      shock: "-20%",
      estimatedImpact: Math.round(impact),
      explanation: "Broad equity market decline impacts equity-heavy exposure."
    });
  }

  // Scenario 2: Crypto drawdown
  if (cryptoExposurePct > 0 && totalValue > 0) {
    const cryptoDrawdownPct = 0.4; // -40%
    const impact =
      totalValue * (cryptoExposurePct / 100) * cryptoDrawdownPct;

    scenarios.push({
      name: "Crypto Drawdown",
      severity: "HIGH",
      shock: "-40%",
      estimatedImpact: Math.round(impact),
      explanation: "High volatility crypto assets amplify downside risk."
    });
  }

  // Scenario 3: Top holding shock
  if (topWeightPct > 0 && totalValue > 0) {
    const holdingShockPct = 0.3; // -30%
    const impact =
      totalValue * (topWeightPct / 100) * holdingShockPct;

    scenarios.push({
      name: "Top Holding Shock",
      severity: topWeightPct >= 25 ? "CRITICAL" : "MODERATE",
      shock: "-30%",
      estimatedImpact: Math.round(impact),
      explanation:
        "Largest holding experiences an isolated adverse event."
    });
  }

  return {
    meta: {
      engine: "RISK_SCENARIO_V1",
      generatedAt
    },
    scenarios,
    guarantees: {
      deterministic: true,
      readOnly: true,
      rendererSafe: true,
      noAdvice: true
    }
  };
}
