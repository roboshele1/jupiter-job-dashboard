/**
 * Confidence Engine
 * -----------------
 * Aggregates multi-engine signal strength.
 */

export function confidenceScore(inputs = []) {
  if (!inputs.length) return 0;

  const total = inputs.reduce((a, b) => a + b, 0);
  return Math.round(total / inputs.length);
}

