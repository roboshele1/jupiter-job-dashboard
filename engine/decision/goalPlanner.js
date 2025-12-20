// engine/decision/goalPlanner.js
import { futureValue, requiredPrincipal } from './cagrMath.js';

export function planGoal({
  targetValue,
  months,
  assumedCAGR,
  currentCapital = 0
}) {
  const neededPrincipal = requiredPrincipal({
    targetValue,
    annualCAGR: assumedCAGR,
    months
  });

  const projectedValue = futureValue({
    principal: currentCapital,
    annualCAGR: assumedCAGR,
    months
  });

  return {
    targetValue,
    months,
    assumedCAGR,
    requiredInitialCapital: Number(neededPrincipal.toFixed(2)),
    projectedFromCurrent: Number(projectedValue.toFixed(2)),
    capitalGap: Number((neededPrincipal - currentCapital).toFixed(2))
  };
}

