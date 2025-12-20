// engine/decision/calibration/testCalibration.js
import { calibrateConfidence } from './confidenceCalibrator.js';

console.log(
  calibrateConfidence({
    rawConfidence: 1.3,
    weight: 1.1,
    volatility: 1.2
  })
);

