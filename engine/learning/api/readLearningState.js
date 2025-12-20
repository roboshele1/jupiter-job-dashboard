import { getPersistedEvents } from '../learningRegistry.js';

export function readLearningState() {
  const events = getPersistedEvents();

  return {
    totalEvents: events.length,
    lastEvent: events.at(-1) || null,
    decisions: events.filter(e => e.type === 'DECISION'),
    growthSignals: events.filter(e => e.type === 'GROWTH_SIGNAL'),
    raw: events
  };
}

