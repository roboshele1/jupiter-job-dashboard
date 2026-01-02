/**
 * Insights Rules — Phase 1A / 1B
 * Deterministic, observer-safe, schema-aligned
 */

export function applySnapshotRules(insights, snapshot) {
  if (!snapshot) {
    insights.limits.push("Snapshot not finalized");
    insights.warnings.push("Snapshot timestamp unavailable");
    return;
  }

  insights.snapshot.available = true;

  if (!snapshot.timestamp) {
    insights.warnings.push("Snapshot timestamp unavailable");
  } else {
    insights.snapshot.timestamp = snapshot.timestamp;
  }
}

export function applyPortfolioRules(insights, snapshot) {
  if (!snapshot || !snapshot.portfolioValue) {
    insights.limits.push("Portfolio value unavailable");
    return;
  }

  insights.portfolio.available = true;
}

export function applySignalRules(insights, signals) {
  if (!signals) {
    insights.limits.push("Signals unavailable");
    return;
  }

  insights.signals.available = true;
}

export function applyRiskRules(insights, risks) {
  if (!risks) {
    insights.risks.limits.push("Risk data unavailable");
    return;
  }
}

