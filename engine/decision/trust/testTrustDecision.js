import { applyTrustWeight } from './trustWeightEngine.js';
import { trustGate } from './trustGate.js';

const decision = {
  symbol: 'NVDA',
  action: 'BUY',
  confidence: 1.2
};

const trustLevels = ['HIGH', 'MEDIUM', 'LOW', 'UNTRUSTED'];

trustLevels.forEach(level => {
  const weighted = applyTrustWeight(decision, level);
  const gated = trustGate(weighted, level);
  console.log(level, gated);
});

