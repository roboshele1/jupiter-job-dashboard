// engine/decision/calibration/confidenceCalibrator.js

const MAX_CONFIDENCE = 1.5;
const MIN_CONFIDENCE = 0.5;

export function calibrateConfidence({ rawConfidence, weight = 1.0, volatility = 1.0 }) {
  let adjusted = rawConfidence * weight;

  // volatility penalty
  adjusted = adjusted / volatility;

  // clamp bounds
  if (adjusted > MAX_CONFIDENCE) adjusted = MAX_CONFIDENCE;
  if (adjusted < MIN_CONFIDENCE) adjusted = MIN_CONFIDENCE;

  return Number(adjusted.toFixed(2));
}

