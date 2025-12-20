// engine/decision/bias/decisionAdapter.js

import { applyBias } from './biasEngine.js';

export function adaptDecision(rawDecision) {
  if (!rawDecision.confidence) {
    rawDecision.confidence = 1.0;
  }

  return applyBias(rawDecision);
}

