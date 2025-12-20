// engine/decision/trust/trustWeightEngine.js

export function applyTrustWeight(decision, trustLevel) {
  let multiplier = 1;

  if (trustLevel === 'HIGH') multiplier = 1.0;
  if (trustLevel === 'MEDIUM') multiplier = 0.9;
  if (trustLevel === 'LOW') multiplier = 0.75;
  if (trustLevel === 'UNTRUSTED') multiplier = 0.5;

  return {
    ...decision,
    confidence: Number((decision.confidence * multiplier).toFixed(2)),
    trustLevel,
    weighted: true
  };
}

