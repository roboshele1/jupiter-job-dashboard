// engine/decision/decisionAggregator.js

export function aggregateDecisions(input) {
  if (!input) {
    throw new Error("Invalid aggregation input");
  }

  const scoredDecisions = Array.isArray(input)
    ? input
    : Array.isArray(input.scoredDecisions)
    ? input.scoredDecisions
    : null;

  if (!scoredDecisions) {
    throw new Error("Invalid aggregation input");
  }

  const ranked = [...scoredDecisions]
    .sort((a, b) => b.score - a.score)
    .map((d, i) => ({
      ...d,
      rank: i + 1
    }));

  return {
    asOf: input.asOf ?? Date.now(),
    decisions: ranked
  };
}

