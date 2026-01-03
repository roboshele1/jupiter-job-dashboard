// engine/alerts/alertsEngineV1.js
// Alerts Engine V1 — deterministic synthesis layer
// Inputs: Decision Engine V2 output + Risk Engine V1 metrics
// Output: alerts[] (read-only, snapshot-safe)

export function runAlertsEngineV1({ decisionOutput, riskEngine }) {
  if (!decisionOutput || !Array.isArray(decisionOutput.alerts)) {
    throw new Error("AlertsEngineV1: invalid decision output");
  }

  const riskMetrics = riskEngine?.metrics ?? {};
  const baseAlerts = decisionOutput.alerts;

  const synthesized = baseAlerts.map(alert => {
    let severity = "info";

    if (riskMetrics.maxConviction >= 0.85) severity = "high";
    else if (riskMetrics.maxConviction >= 0.65) severity = "medium";

    return {
      engine: "ALERTS_ENGINE_V1",
      sourceDecision: alert.action,
      symbol: alert.symbol,
      conviction: Number(alert.conviction ?? 0),
      severity,
      timestamp: Date.now(),
      readOnly: true
    };
  });

  return {
    engine: "ALERTS_ENGINE_V1",
    count: synthesized.length,
    alerts: synthesized,
    sources: {
      decision: "DECISION_ENGINE_V2",
      risk: riskEngine?.engine ?? "NONE"
    },
    readOnly: true
  };
}

