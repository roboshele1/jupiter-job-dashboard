import { evaluateDrift } from './driftEngine.js';

const t0 = Date.now() - 1000 * 60 * 60 * 24 * 40; // 40 days ago

console.log(evaluateDrift({
  confidence: 1.1,
  bias: 1.0,
  signalTs: t0
}));

console.log(evaluateDrift({
  confidence: 1.3,
  bias: 1.25,
  signalTs: t0
}));

