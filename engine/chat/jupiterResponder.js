import { queryLearning } from '../learning/api/index.js';

export function respondToQuestion(question) {
  const learningResponse = queryLearning(question);

  return {
    answer: formatAnswer(learningResponse),
    meta: {
      source: 'learning-engine',
      ts: Date.now()
    }
  };
}

function formatAnswer(result) {
  if (!result.lastSignal) {
    return 'No significant learning signals detected yet.';
  }

  const s = result.lastSignal.payload;

  return `
Latest growth signal detected:
Symbol: ${s.symbol}
Revenue CAGR: ${s.metrics.revenueCAGR}%
Margin Expansion: ${s.metrics.marginExpansion ? 'Yes' : 'No'}
Institutional Flow: ${s.metrics.institutionalFlow}
`.trim();
}

