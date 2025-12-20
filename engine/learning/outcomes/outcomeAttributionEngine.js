// engine/learning/outcomes/outcomeAttributionEngine.js

import { recordFeedback } from '../feedback/reinforcementEngine.js';

const outcomes = [];

export function attributeOutcome({ symbol, action, confidence, actualReturn }) {
  const success = actualReturn > 0;
  const score = success ? confidence : confidence * -1;

  const outcome = {
    symbol,
    action,
    confidence,
    actualReturn,
    success,
    score,
    ts: Date.now()
  };

  outcomes.push(outcome);

  recordFeedback({
    type: 'DECISION_OUTCOME',
    payload: outcome
  });

  return outcome;
}

export function getOutcomes() {
  return outcomes;
}

