// engine/learning/feedback/testReinforcement.js
import { reinforceLatest } from './reinforceFromOutcome.js';
import { getWeights } from '../reinforcement/confidenceWeights.js';

reinforceLatest();
console.log(getWeights());

