// engine/decision/testGoalPlanner.js
import { planGoal } from './goalPlanner.js';

const scenario = planGoal({
  targetValue: 1000000,
  months: 36,
  assumedCAGR: 25,
  currentCapital: 250000
});

console.log(JSON.stringify(scenario, null, 2));

