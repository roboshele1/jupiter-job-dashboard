import { scoreDecisions } from './decisionScorer.js';
import { aggregateDecisions } from './decisionAggregator.js';
import { applyTTL } from './decisionTTL.js';
import { applyPolicyGate } from './decisionPolicyGate.js';
import { adaptDecisionOutput } from './decisionOutputAdapter.js';

export function runDecisionEngineV2(input) {
  console.log('================ DECISION ENGINE V2 ================');

  console.log('INPUT →');
  console.log(JSON.stringify(input, null, 2));

  const scored = scoreDecisions(input);
  console.log('AFTER SCORER →');
  console.log(JSON.stringify(scored, null, 2));

  const aggregated = aggregateDecisions(scored);
  console.log('AFTER AGGREGATOR →');
  console.log(JSON.stringify(aggregated, null, 2));

  const ttlApplied = applyTTL(aggregated);
  console.log('AFTER TTL →');
  console.log(JSON.stringify(ttlApplied, null, 2));

  const gated = applyPolicyGate(ttlApplied);
  console.log('AFTER POLICY GATE →');
  console.log(JSON.stringify(gated, null, 2));

  const output = adaptDecisionOutput(gated);
  console.log('AFTER OUTPUT ADAPTER →');
  console.log(JSON.stringify(output, null, 2));

  console.log('================ END ENGINE RUN =====================');

  return {
    engine: 'DECISION_ENGINE_V2',
    output
  };
}

