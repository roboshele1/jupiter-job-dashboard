/**
 * Risk Engine
 * Computes drawdown, stress, and risk classification
 */

export function computeRisk(portfolio) {
  const risks = [];

  // --- Drawdown Simulation ---
  const drawdownScenarios = {
    mild: portfolio.totalMarketValue * 0.9,
    moderate: portfolio.totalMarketValue * 0.75,
    severe: portfolio.totalMarketValue * 0.6
  };

  // --- Concentration Risk ---
  if (portfolio.concentration.top1 >= 60) {
    risks.push({
      type: "concentration",
      severity: "high",
      message: "Single-position concentration increases drawdown risk."
    });
  }

  // --- Exposure Risk ---
  if (portfolio.exposure.crypto >= 65) {
    risks.push({
      type: "volatility",
      severity: "medium",
      message: "High crypto exposure increases volatility risk."
    });
  }

  // --- Risk Score (0–100) ---
  let riskScore = 50;

  if (portfolio.concentration.top1 > 60) riskScore += 15;
  if (portfolio.exposure.crypto > 70) riskScore += 15;
  if (portfolio.totalPnLPct > 30) riskScore += 5; // profit-at-risk

  riskScore = Math.max(0, Math.min(100, riskScore));

  // --- Risk Level ---
  let riskLevel = "Moderate";
  if (riskScore >= 70) riskLevel = "High";
  if (riskScore <= 30) riskLevel = "Low";

  return {
    risks,
    riskScore,
    riskLevel,
    drawdownScenarios
  };
}

