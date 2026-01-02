/**
 * Insights Rules — Observer Safe
 * Phase 1B
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
  }
}

export function applyPortfolioRules(insights, portfolio) {
  if (!portfolio) {
    insights.limits.push("Portfolio data unavailable");
    return;
  }

  insights.portfolio.available = true;
}

export function applySignalRules(insights, signals) {
  if (!signals) {
    insights.limits.push("Signals withheld");
    return;
  }

  insights.signals.available = true;
}

export function applyRiskRules(insights, risks) {
  if (!risks) {
    insights.limits.push("Risk evaluation unavailable");
    return;
  }

  insights.risks.available = true;
}

