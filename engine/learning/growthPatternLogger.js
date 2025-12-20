import { registerEvent } from './learningRegistry.js';

export function logGrowthSignal(symbol, metrics) {
  registerEvent('GROWTH_SIGNAL', {
    symbol,
    metrics
  });
}

