/**
 * Alerts Engine
 * Evaluates strategy breaches and emits alert objects
 */

export function computeAlerts({
  cryptoExposure,
  riskScore,
  rebalanceTarget,
  rebalanceTolerance,
  maxRiskScore
}) {
  const alerts = [];

  // Rebalance breach
  if (cryptoExposure > rebalanceTarget + rebalanceTolerance) {
    alerts.push({
      type: "REBALANCE",
      severity: "HIGH",
      message: "Crypto exposure exceeds rebalance band."
    });
  }

  // Risk cap breach
  if (riskScore > maxRiskScore) {
    alerts.push({
      type: "RISK",
      severity: "HIGH",
      message: "Risk score exceeds defined risk cap."
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "SYSTEM",
      severity: "LOW",
      message: "All strategy rules within tolerance."
    });
  }

  return alerts;
}

