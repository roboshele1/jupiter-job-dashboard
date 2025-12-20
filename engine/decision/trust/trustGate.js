// engine/decision/trust/trustGate.js

export function trustGate(decision, trustLevel) {
  if (trustLevel === 'UNTRUSTED') {
    return {
      ...decision,
      action: 'HOLD',
      gated: true,
      reason: 'Trust level too low'
    };
  }

  return decision;
}

