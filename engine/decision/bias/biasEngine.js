// engine/decision/bias/biasEngine.js

import { getReinforcementWeights } from '../../learning/feedback/reinforcementEngine.js';

export function applyBias(decision) {
  const weights = getReinforcementWeights();

  if (!decision || !decision.symbol) return decision;

  const key = decision.symbol;
  const bias = weights[key] || 1.0;

  return {
    ...decision,
    confidence: Number((decision.confidence * bias).toFixed(2)),
    biasApplied: true
  };
}

