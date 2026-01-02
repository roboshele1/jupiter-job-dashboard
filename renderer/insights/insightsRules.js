/**
 * Insights Rules — Canonical, Phase 1B
 * Must match createEmptyInsights EXACTLY
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
  if (!snapshot || snapshot.portfolioValue == null) {
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
    insights.limits.push("Risk data unavailable");
    return;
  }

  insights.risks.available = true;
}

