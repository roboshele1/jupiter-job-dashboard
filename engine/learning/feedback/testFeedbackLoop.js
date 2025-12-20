// engine/learning/feedback/testFeedbackLoop.js
import { ingestDecisionFeedback } from './ingestFeedback.js';
import { getPersistedEvents } from '../learningRegistry.js';

ingestDecisionFeedback({
  decisionType: 'GOAL_PLANNING',
  input: { target: 1000000, months: 36 },
  output: { capitalGap: 262000, success: false },
  confidence: 0.72
});

console.log(getPersistedEvents().slice(-1));

