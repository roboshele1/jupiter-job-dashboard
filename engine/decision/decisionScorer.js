// engine/decision/decisionScorer.js

export function scoreDecisions({ asOf, portfolio, signals }) {
  if (!Array.isArray(signals)) {
    throw new Error('Invalid DecisionInputContractV2');
  }

  // 🔑 RETURN AN ARRAY — NOT AN OBJECT
  return signals.map((s, i) => ({
    scope: s.scope,
    symbol: s.symbol,
    action: s.action,
    conviction: s.conviction ?? 0,
    score: s.conviction ?? 0,
    rationale: s.rationale ?? [],
    ttlHours: s.ttlHours ?? 0,
    asOf,
    _index: i
  }));
}

