// engine/learning/outcomes/index.js

import { attributeOutcome } from './outcomeAttributionEngine.js';
import { storeOutcome } from './outcomeMemory.js';

export function processOutcome(data) {
  const outcome = attributeOutcome(data);
  storeOutcome(outcome);
  return outcome;
}

