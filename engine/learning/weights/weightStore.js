// engine/learning/weights/weightStore.js
const weights = {};

export function updateWeight(key, delta) {
  if (!weights[key]) weights[key] = 1.0;
  weights[key] += delta;
  return weights[key];
}

export function getWeights() {
  return weights;
}

