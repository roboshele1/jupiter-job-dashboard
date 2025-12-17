/**
 * Decision Engine
 * Determines portfolio-level action guidance
 */

export function evaluateDecision({
  riskScore,
  confidenceScore,
  concentrationTop1,
  cryptoExposure
}) {
  let action = "HOLD";
  let pressure = "LOW";
  let reasons = [];

  if (concentrationTop1 >= 60) {
    reasons.push("High single-position concentration");
    pressure = "HIGH";
  }

  if (riskScore >= 70) {
    reasons.push("Elevated portfolio risk");
    pressure = "HIGH";
  }

  if (cryptoExposure >= 65) {
    reasons.push("Crypto exposure exceeds balanced threshold");
    pressure = pressure === "HIGH" ? "HIGH" : "MEDIUM";
  }

  if (pressure === "HIGH" && confidenceScore < 65) {
    action = "REDUCE";
  } else if (confidenceScore >= 70 && riskScore < 60) {
    action = "ADD";
  }

  return {
    action,
    pressure,
    reasons
  };
}

