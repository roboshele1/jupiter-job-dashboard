// engine/learning/queryEngine.js
import { getPersistedEvents } from './learningRegistry.js';

export function queryLearning(question) {
  const events = getPersistedEvents();

  const growthSignals = events.filter(e => e.type === 'GROWTH_SIGNAL');
  const decisions = events.filter(e => e.type === 'DECISION');

  const lastSignal = growthSignals[growthSignals.length - 1] || null;

  return {
    answer: lastSignal
      ? `Latest growth signal detected:\nSymbol: ${lastSignal.payload.symbol}\nRevenue CAGR: ${lastSignal.payload.metrics.revenueCAGR}%\nMargin Expansion: ${lastSignal.payload.metrics.marginExpansion ? 'Yes' : 'No'}\nInstitutional Flow: ${lastSignal.payload.metrics.institutionalFlow}`
      : 'No growth signals detected yet.',
    summary: {
      totalEvents: events.length,
      decisions: decisions.length,
      growthSignals: growthSignals.length
    },
    lastSignal
  };
}

