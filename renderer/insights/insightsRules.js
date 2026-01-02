/**
 * Insights Rules — Phase 1A / 1B
 * Deterministic, observer-safe, total functions
 */

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function applySnapshotRules(insights, snapshot) {
  if (!snapshot?.available) {
    insights.limits.push("Snapshot not finalized");
    insights.warnings.push("Snapshot timestamp unavailable");
    return;
  }

  if (!snapshot.timestamp) {
    insights.warnings.push("Snapshot timestamp unavailable");
  }
}

export function applyPortfolioRules(insights, snapshot) {
  if (!snapshot?.portfolioValue) {
    insights.limits.push("Portfolio value unavailable");
  }
}

export function applySignalRules(insights, signals) {
  if (!signals?.available) {
    insights.limits.push("Signals withheld");
  }
}

export function applyRiskRules(insights, risks) {
  const warnings = safeArray(risks?.warnings);
  const limits = safeArray(risks?.limits);

  warnings.forEach(w => insights.warnings.push(w));
  limits.forEach(l => insights.limits.push(l));
}

