// engine/chat/decisionResponder.js
import { planGoal } from '../decision/goalPlanner.js';

export function respondDecision(query) {
  const { target, months, cagr, capital } = query;

  const plan = planGoal({
    targetValue: target,
    months,
    assumedCAGR: cagr,
    currentCapital: capital
  });

  return {
    answer:
      `To reach $${target.toLocaleString()} in ${months} months ` +
      `at ${cagr}% CAGR:\n` +
      `• Required capital: $${plan.requiredInitialCapital.toLocaleString()}\n` +
      `• From current: $${plan.projectedFromCurrent.toLocaleString()}\n` +
      `• Capital gap: $${plan.capitalGap.toLocaleString()}`,
    meta: {
      engine: 'decision-math',
      deterministic: true
    }
  };
}

