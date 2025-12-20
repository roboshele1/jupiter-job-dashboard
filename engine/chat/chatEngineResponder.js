// engine/chat/chatEngineResponder.js
import { getPersistedEvents } from '../learning/learningRegistry.js';

export function respondToChatQuery(question) {
  const events = getPersistedEvents();

  if (!events.length) {
    return {
      answer: 'No signals or decisions recorded yet.',
      meta: { source: 'learning-engine', ts: Date.now() },
    };
  }

  const last = events[events.length - 1];

  if (last.type === 'GROWTH_SIGNAL') {
    const m = last.payload.metrics;
    return {
      answer:
        `Latest growth signal detected:\n` +
        `Symbol: ${last.payload.symbol}\n` +
        `Revenue CAGR: ${m.revenueCAGR}%\n` +
        `Margin Expansion: ${m.marginExpansion ? 'Yes' : 'No'}\n` +
        `Institutional Flow: ${m.institutionalFlow}`,
      meta: { source: 'learning-engine', ts: last.ts },
    };
  }

  return {
    answer: 'Latest event recorded, but no growth signal interpretation available.',
    meta: { source: 'learning-engine', ts: last.ts },
  };
}

