// engine/learning/reinforcement/confidenceWeights.js
const weights = new Map();

export function reinforce(type, success = true) {
  const current = weights.get(type) || 1;
  const updated = success ? current * 1.1 : current * 0.9;
  weights.set(type, Number(updated.toFixed(4)));
  return weights.get(type);
}

export function getWeights() {
  return Object.fromEntries(weights);
}

