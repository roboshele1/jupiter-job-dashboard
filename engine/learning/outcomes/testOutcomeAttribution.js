// engine/learning/outcomes/testOutcomeAttribution.js

import { processOutcome } from './index.js';
import { getOutcomeHistory } from './outcomeMemory.js';

processOutcome({
  symbol: 'NVDA',
  action: 'BUY',
  confidence: 1.3,
  actualReturn: 0.18
});

console.log(getOutcomeHistory());

