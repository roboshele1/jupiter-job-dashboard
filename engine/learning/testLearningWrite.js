import { logDecision } from './decisionLogger.js';
import { logGrowthSignal } from './growthPatternLogger.js';

logDecision({
  goal: 'Reach $1M',
  horizonMonths: 36,
  instrument: 'NVDA'
});

logGrowthSignal('NVDA', {
  revenueCAGR: 35,
  marginExpansion: true,
  institutionalFlow: 'rising'
});

