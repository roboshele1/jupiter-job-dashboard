// engine/decision/decisionPolicyGate.js

export function applyPolicyGate({ asOf, decisions, risk }) {
  if (!Array.isArray(decisions)) {
    throw new Error('Invalid policy gate input');
  }

  const maxConviction =
    risk && typeof risk.maxConviction === 'number'
      ? risk.maxConviction
      : 1;

  const allowed = [];
  const modified = [];
  const blocked = [];

  for (const d of decisions) {
    if (typeof d.conviction !== 'number') {
      blocked.push(d);
      continue;
    }

    if (d.conviction > maxConviction) {
      modified.push({
        ...d,
        conviction: maxConviction,
        rationale: [...(d.rationale || []), 'Conviction capped by risk policy']
      });
    } else {
      allowed.push(d);
    }
  }

  return [...allowed, ...modified];
}

