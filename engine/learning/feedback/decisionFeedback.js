// engine/learning/feedback/decisionFeedback.js
import { registerEvent } from '../learningRegistry.js';

export function recordDecisionOutcome({ decisionType, input, output, confidence }) {
  const event = {
    type: 'DECISION_OUTCOME',
    payload: {
      decisionType,
      input,
      output,
      confidence
    }
  };

  registerEvent(event);
  return event;
}

