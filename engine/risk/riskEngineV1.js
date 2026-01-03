// engine/risk/riskEngineV1.js
// Risk Engine V1 — READ-ONLY consumer of Decision Engine V2 output
// No side effects. No portfolio mutation.

export function runRiskEngineV1({ decisionOutput, portfolio, asOf }) {
  if (!decisionOutput || typeof decisionOutput !== 'object') {
    throw new Error('Invalid decision output input');
  }
  if (!Array.isArray(decisionOutput.alerts)) {
    throw new Error('Invalid decision output: alerts missing');
  }

  const alerts = decisionOutput.alerts;

  // Simple V1 risk metrics (deterministic, transparent)
  const metrics = {
    asOf: asOf ?? Date.now(),
    totalAlerts: alerts.length,
    maxConviction: alerts.reduce(
      (m, a) => Math.max(m, Number(a.conviction ?? 0)),
      0
    ),
    symbolsAtRisk: Array.from(
      new Set(alerts.map(a => a.symbol).filter(Boolean))
    )
  };

  return {
    engine: 'RISK_ENGINE_V1',
    metrics,
    source: 'DECISION_ENGINE_V2',
    readOnly: true
  };
}

