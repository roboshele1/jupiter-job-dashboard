// engine/learning/stability/testStability.js

import { computeStability } from './stabilityEngine.js';

const drift = {
  ok: false,
  alerts: [
    { type: 'CONFIDENCE_DRIFT', delta: 0.2 },
    { type: 'BIAS_DRIFT', delta: 0.25 },
    { type: 'SIGNAL_DECAY', ageDays: 40 }
  ]
};

const calibrationFactor = 1.19;

console.log(
  computeStability({ driftResult: drift, calibrationFactor })
);

