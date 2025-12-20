// engine/learning/reinforcement/applyReinforcement.js
import { reinforce } from './confidenceWeights.js';

export function applyOutcome(event) {
  if (!event || !event.type) return null;
  return reinforce(event.type, true);
}

