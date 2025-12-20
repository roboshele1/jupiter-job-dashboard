// engine/decision/bias/testBias.js

import { adaptDecision } from './decisionAdapter.js';

const decision = {
  symbol: 'NVDA',
  action: 'BUY',
  confidence: 1.0
};

console.log(adaptDecision(decision));

