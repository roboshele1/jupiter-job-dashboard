// engine/decision/decisionAggregator.js
// Decision Aggregator V2 — pure, deterministic, read-only

/**
 * @typedef {Object} ScoredDecision
 * @property {string} scope
 * @property {string} symbol
 * @property {string} action
 * @property {number} score
 * @property {number} conviction
 * @property {string[]} rationale
 * @property {number} ttlHours
 */

/**
 * Aggregates scored decisions into a ranked, canonical output.
 * Deterministic: no side effects, no time, no randomness.
 *
 * @param {Object} input
 * @param {number} input.asOf
 * @param {ScoredDecision[]} input.scoredDecisions
 * @returns {Object}
 */
export function aggregateDecisions(input) {
  if (!input || !Array.isArray(input.scoredDecisions)) {
    throw new Error("Invalid aggregation input");
  }

  const ranked = [...input.scoredDecisions]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.conviction !== a.conviction) return b.conviction - a.conviction;
      return a.symbol.localeCompare(b.symbol);
    })
    .map((d, idx) => ({
      ...d,
      rank: idx + 1
    }));

  return {
    engine: "DECISION_ENGINE_V2",
    asOf: input.asOf,
    count: ranked.length,
    decisions: ranked
  };
}

