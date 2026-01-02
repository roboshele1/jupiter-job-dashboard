// engine/alerts/alertsEngine.js
// Alerts V1 — Pure evaluation engine (read-only)
// Consumes Signals snapshot and emits alert candidates deterministically

function isFiniteNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

// Default thresholds (conservative, can be tuned later)
const THRESHOLDS = {
  portfolioImpactPct: 0.02,     // 2% move
  momentumMs: 15 * 60 * 1000,   // 15 minutes
  confidenceMin: 0.7            // normalized confidence
};

export function evaluateAlerts(insightsSnapshot, thresholds = THRESHOLDS) {
  const alerts = [];

  if (!insightsSnapshot || typeof insightsSnapshot !== 'object') return alerts;

  const { deltas = {}, confidence = {} } = insightsSnapshot;

  const impactPct = deltas.deltaPortfolioImpactPct;
  const momentumMs = deltas.deltaMomentumMs;
  const conf = confidence.confidence;

  // Alert: Large portfolio impact
  if (isFiniteNumber(impactPct) && Math.abs(impactPct) >= thresholds.portfolioImpactPct) {
    alerts.push({
      type: 'PORTFOLIO_IMPACT',
      severity: Math.abs(impactPct) >= thresholds.portfolioImpactPct * 2 ? 'high' : 'medium',
      value: impactPct,
      message: 'Portfolio impact exceeded threshold'
    });
  }

  // Alert: Rapid momentum change
  if (isFiniteNumber(momentumMs) && Math.abs(momentumMs) <= thresholds.momentumMs) {
    alerts.push({
      type: 'RAPID_MOMENTUM',
      severity: 'medium',
      value: momentumMs,
      message: 'Rapid momentum change detected'
    });
  }

  // Alert: High confidence composite
  if (isFiniteNumber(conf) && conf >= thresholds.confidenceMin) {
    alerts.push({
      type: 'HIGH_CONFIDENCE_SIGNAL',
      severity: 'info',
      value: conf,
      message: 'High confidence signal detected'
    });
  }

  return alerts;
}

