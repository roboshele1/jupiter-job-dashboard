// engine/decision/decisionEngine.js
import { calibrateConfidence } from './calibration/confidenceCalibrator.js';

export function makeDecision({ symbol, confidence, volatility = 1.0 }) {
  const calibratedConfidence = calibrateConfidence({
    rawConfidence: confidence,
    weight: confidence,
    volatility
  });

  return {
    symbol,
    action: calibratedConfidence >= 1 ? 'BUY' : 'HOLD',
    rationale: 'Growth signal detected',
    confidence: calibratedConfidence,
    ts: Date.now()
  };
}

