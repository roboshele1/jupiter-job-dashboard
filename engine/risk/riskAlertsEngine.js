// engine/risk/riskAlertsEngine.js

/**
 * Deterministic risk alerts derivation
 * Input: RISK_SNAPSHOT_V1
 * Output: RISK_ALERTS_V1
 */
export function deriveRiskAlerts(riskSnapshot) {
  if (!riskSnapshot || riskSnapshot.status !== "OK") {
    return {
      contract: "RISK_ALERTS_V1",
      status: "NO_ALERTS",
      alerts: [],
    };
  }

  const alerts = [];

  const {
    concentrationFlag,
    btcDominanceFlag,
    topHolding,
    topHoldingWeightPct,
    btcExposurePct,
  } = riskSnapshot.metrics;

  if (concentrationFlag) {
    alerts.push({
      type: "CONCENTRATION",
      message: `Top holding ${topHolding} exceeds safe concentration (${topHoldingWeightPct}%)`,
      severity: "HIGH",
    });
  }

  if (btcDominanceFlag) {
    alerts.push({
      type: "BTC_DOMINANCE",
      message: `BTC exposure is elevated (${btcExposurePct}%)`,
      severity: "MEDIUM",
    });
  }

  return {
    contract: "RISK_ALERTS_V1",
    status: alerts.length ? "ALERTS_PRESENT" : "CLEAR",
    alerts,
  };
}

