/**
 * Insights Rules — Phase 1A (Observer Intelligence)
 *
 * Rules are:
 * - Deterministic
 * - Read-only
 * - Schema-safe
 * - No assumptions about snapshot completeness
 */

export function applySnapshotRules(interpretation, insights) {
  if (!interpretation?.snapshot?.available) {
    insights.limits.push("Snapshot not finalized");
    insights.warnings.push("Snapshot timestamp unavailable");
    insights.snapshot.available = false;
    return;
  }

  insights.snapshot.available = true;
}

export function applyPortfolioRules(interpretation, insights) {
  const portfolio = interpretation?.portfolio;

  if (!portfolio) {
    insights.signals.missing.push(
      "portfolioValue",
      "allocation",
      "topHoldings"
    );
    return;
  }

  insights.portfolio.totalValue = portfolio.totalValue ?? null;
  insights.portfolio.allocation = portfolio.allocation ?? null;
  insights.portfolio.topHoldings = portfolio.topHoldings ?? [];

  if (portfolio.totalValue == null) {
    insights.signals.missing.push("portfolioValue");
  }
}

export function applySignalRules(interpretation, insights) {
  const signals = interpretation?.signals;

  if (!signals) {
    insights.signals.missing.push(
      "dailyPL",
      "dailyPLPct"
    );
    return;
  }

  insights.signals.available.push(
    ...Object.keys(signals)
  );
}

export function applyRiskRules(interpretation, insights) {
  const risks = interpretation?.risks;

  if (!risks || risks.length === 0) {
    insights.risks.observations.push(
      "No structural risks detected"
    );
    return;
  }

  insights.risks.observations.push(...risks);
}

