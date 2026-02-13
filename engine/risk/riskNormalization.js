/**
 * Risk Normalization Layer — D8
 * --------------------------------
 * Append-only wrapper over computeRiskSnapshot().
 *
 * Purpose:
 * - Standardize regime language
 * - Normalize exposure bands
 * - Provide deterministic signal-friendly structure
 *
 * Rules:
 * - Read-only
 * - No mutation of upstream snapshot
 * - No execution authority
 */

import { computeRiskSnapshot } from "./riskEngine.js";

function classifyRegime(risk) {
  if (!risk?.available) return "UNKNOWN";

  if (risk.flags?.highCryptoExposure || risk.flags?.highConcentration) {
    return "STRESS";
  }

  if (risk.bands?.cryptoExposure === "ELEVATED") {
    return "RISK_ON";
  }

  return "NORMAL";
}

function normalizeBands(risk) {
  return {
    cryptoExposure: risk?.bands?.cryptoExposure || "UNKNOWN",
    concentration:
      risk?.flags?.highConcentration === true ? "HIGH" : "NORMAL"
  };
}

export function normalizeRiskSnapshot(portfolio) {
  const base = computeRiskSnapshot(portfolio);

  if (!base?.available) {
    return {
      available: false,
      regime: "UNKNOWN",
      normalized: true
    };
  }

  const regime = classifyRegime(base);

  return {
    ...base,

    regime,

    normalizedBands: normalizeBands(base),

    normalizationMeta: {
      normalized: true,
      source: "riskNormalizationLayer",
      generatedAt: Date.now()
    }
  };
}

export default Object.freeze({
  normalizeRiskSnapshot
});
