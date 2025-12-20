// engine/learning/weights/weightUpdater.js
import { updateWeight } from './weightStore.js';

export function applyOutcomeWeight(outcome) {
  const baseKey = `${outcome.symbol}:${outcome.action}`;
  const delta = outcome.success ? 0.05 : -0.05;
  return updateWeight(baseKey, delta);
}

