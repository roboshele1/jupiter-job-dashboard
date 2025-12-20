// engine/learning/weights/testWeightUpdate.js
import { applyOutcomeWeight } from './weightUpdater.js';
import { getWeights } from './weightStore.js';

applyOutcomeWeight({ symbol: 'NVDA', action: 'BUY', success: true });
applyOutcomeWeight({ symbol: 'NVDA', action: 'BUY', success: true });

console.log(getWeights());

