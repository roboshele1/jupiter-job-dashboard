import { ensureArrays } from "./insightsSchema.js";

export function applySnapshotRules(insights, snapshot) {
  ensureArrays(insights);

  if (!snapshot || snapshot.timestamp == null) {
    insights.warnings.push("Snapshot timestamp unavailable");
    insights.limits.push("Snapshot not finalized");
    return;
  }

  insights.snapshot.available = true;
  insights.snapshot.timestamp = snapshot.timestamp;

  // ✅ FINALIZATION BRIDGE (ROOT FIX)
  if (snapshot.totalValue != null) {
    insights.snapshot.totalValue = snapshot.totalValue;
    insights.portfolio.totalValue = snapshot.totalValue;
  }
}

export function applyPortfolioRules(insights, portfolio = {}) {
  ensureArrays(insights);

  if (portfolio.totalValue != null) {
    insights.portfolio.available = true;
    insights.portfolio.totalValue = portfolio.totalValue;
  }
}

export function applySignalRules(insights, signals = []) {
  ensureArrays(insights);
  if (signals.length > 0) {
    insights.signals.available = true;
    insights.signals.items = signals;
  }
}

export function applyRiskRules(insights, risks = []) {
  ensureArrays(insights);
  if (risks.length > 0) {
    insights.risks.available = true;
    insights.risks.items = risks;
  }
}

