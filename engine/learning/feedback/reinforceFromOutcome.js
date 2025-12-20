// engine/learning/feedback/reinforceFromOutcome.js
import { applyOutcome } from '../reinforcement/applyReinforcement.js';
import { getPersistedEvents } from '../learningRegistry.js';

export function reinforceLatest() {
  const events = getPersistedEvents();
  const last = events[events.length - 1];
  return applyOutcome(last);
}

