// engine/learning/feedback/ingestFeedback.js
import { recordDecisionOutcome } from './decisionFeedback.js';
import { normalizeOutcome } from './normalizeOutcome.js';

export function ingestDecisionFeedback(rawDecision) {
  const normalized = normalizeOutcome(rawDecision);

  return recordDecisionOutcome({
    decisionType: normalized.decisionType,
    input: rawDecision.input,
    output: normalized,
    confidence: normalized.confidence
  });
}

