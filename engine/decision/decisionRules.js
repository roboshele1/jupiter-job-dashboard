import { ACTIONS, SCOPES } from "./decisionTypes.js";

export function evaluatePortfolio(portfolio, risk) {
  if (!portfolio || !portfolio.totals) return [];

  const decisions = [];

  if (risk?.metrics?.maxDrawdownPct > 25) {
    decisions.push({
      scope: SCOPES.PORTFOLIO,
      action: ACTIONS.REDUCE,
      conviction: 0.85,
      rationale: ["Portfolio drawdown exceeds tolerance"],
      ttlHours: 24
    });
  }

  return decisions;
}

export function evaluateSymbols(portfolio, signals) {
  if (!portfolio?.positions || !signals?.signals) return [];

  const out = [];

  for (const p of portfolio.positions) {
    const sig = signals.signals.find(s => s.symbol === p.symbol);
    if (!sig) continue;

    if (sig.confidence === "High" && sig.portfolioImpact === "Positive") {
      out.push({
        scope: SCOPES.SYMBOL,
        symbol: p.symbol,
        action: ACTIONS.HOLD,
        conviction: 0.75,
        rationale: ["High confidence positive signal"],
        ttlHours: 12
      });
    }
  }

  return out;
}

