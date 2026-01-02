// engine/signals/signalsEngine.js
// Signals Engine — V1
// Pure, deterministic, read-only
// Downstream of Insights + Alerts
// Produces renderer-safe signals[]

function classifyImpact(deltaPct) {
  if (Math.abs(deltaPct) >= 0.04) return "High";
  if (Math.abs(deltaPct) >= 0.02) return "Moderate";
  return "Low";
}

function classifyDelta(deltaMs) {
  if (deltaMs <= 5 * 60 * 1000) return "↑";
  if (deltaMs <= 15 * 60 * 1000) return "→";
  return "↓";
}

function classifyConfidence(conf) {
  if (conf >= 0.8) return "High";
  if (conf >= 0.6) return "Medium";
  return "Low";
}

export function buildSignalsSnapshot({ insights, alerts }) {
  const { deltas, confidence } = insights;

  const signal = {
    symbol: "PORTFOLIO",
    assetClass: "aggregate",
    portfolioImpact: classifyImpact(deltas.deltaPortfolioImpactPct),
    confidence: classifyConfidence(confidence.confidence),
    delta: classifyDelta(deltas.deltaMomentumMs)
  };

  return {
    timestamp: Date.now(),
    signals: [signal],
    notifications: alerts.map(a => ({
      type: a.type,
      severity: a.severity
    }))
  };
}

