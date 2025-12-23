/**
 * insightsRules
 * -------------
 * Deterministic rules for generating Insights
 * from interpreted dashboard truth (Phase 3 output).
 */

export function applySnapshotRules(interpretation, insights) {
  if (!interpretation.snapshot?.available) {
    insights.snapshot.available = false;
    insights.risks.dataLimitations.push(
      "Snapshot timestamp unavailable; freshness cannot be assessed."
    );
  } else {
    insights.snapshot.available = true;
    insights.snapshot.timestamp = interpretation.snapshot.timestamp;
  }
}

export function applyPortfolioRules(interpretation, insights) {
  if (interpretation.portfolio?.totalValue != null) {
    insights.portfolio.totalValue = interpretation.portfolio.totalValue;
  }

  if (interpretation.allocation?.summary) {
    insights.portfolio.allocationSummary =
      interpretation.allocation.summary;
  }

  if (interpretation.holdings?.concentrationNote) {
    insights.portfolio.concentrationNote =
      interpretation.holdings.concentrationNote;

    insights.risks.observations.push(
      interpretation.holdings.concentrationNote
    );
  }
}

export function applySignalRules(interpretation, insights) {
  const missing = interpretation.dataQuality?.missingFields || [];

  if (missing.length === 0) {
    insights.signals.available.push("core-portfolio-metrics");
  } else {
    missing.forEach(field =>
      insights.signals.missing.push(field)
    );

    insights.signals.notes.push(
      "Some signals unavailable due to missing underlying data."
    );
  }
}

export function applyRiskRules(interpretation, insights) {
  if (interpretation.dataQuality?.warnings?.length) {
    interpretation.dataQuality.warnings.forEach(warning =>
      insights.risks.dataLimitations.push(warning)
    );
  }
}

